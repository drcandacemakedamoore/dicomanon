var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import policy from './DefaultPolicy';
import sjcl from './sjcl.sha512';
// Prefix from Medical Connections
var UIDPREFIX = "1.2.826.0.1.3680043.10.341.";
// We want to keep the hash algorithm the same to preserve references.
/**
* A hashed UID will make sure there's no information hidden in the UID
* but will maintain relationships between dicoms (e.g. same frame of reference)
*/
function hashedUid(oldUid, force) {
    if (force === void 0) { force = false; }
    var prefix = UIDPREFIX + "512.";
    if (!oldUid.startsWith(prefix) || force) {
        var bits = sjcl.hash.sha512.hash(oldUid);
        return prefix + Math.abs(bits[0]) + "." + Math.abs(bits[1]);
    }
    else {
        return oldUid;
    }
}
;
/**
* This will generate a random UID
*/
function randomUid() {
    var rando = Math.floor(Math.random() * 99999999999999999999);
    return UIDPREFIX + "777." + rando;
}
;
// TODO: Test that there's no personal data stored outside the "Value" for a
// given tag. This should be the case, and we're making the assumption that the
// user is not maliciously trying to hide data.
export default function anonymize(dict) {
    var newDict = {};
    for (var _i = 0, _a = Object.keys(dict); _i < _a.length; _i++) {
        var key = _a[_i];
        // Use default action or action specified in policy
        var rule = policy["default"];
        if (key in policy) {
            rule = policy[key];
        }
        var action = rule["action"];
        // For keep actions we can just pass the tag accross...
        if (action == "keep") {
            newDict[key] = dict[key];
            // TODO: I'm going to assume we're only regenerating UIDs and they
            // always have a VM (multiplicity) of 1, which may be a bad assumption
        }
        else if (action == "regenerate") {
            var oldTag = cloneTag(dict[key]);
            if (rule["method"] == "random") {
                oldTag["Value"] = [randomUid()];
            }
            else if (rule["method"] == "hash") {
                oldTag["Value"] = [hashedUid(oldTag["Value"][0])];
            }
            newDict[key] = oldTag;
            // Then to remove we're just not going to add anything for now.
            // There could be different methods to remove (e.g. just clear the value)
        }
        else if (action == "remove") {
            // Replacement can be used for tags that require a value..
        }
        else if (action == "replace") {
            oldTag = cloneTag(dict[key]);
            // We're assuming the policy is correct for VR, etc.
            oldTag["Value"] = rule["value"];
            newDict[key] = oldTag;
        }
    }
    return newDict;
}
;
var cloneTag = function (oldTag) {
    return {
        Value: __spreadArrays(oldTag.Value),
        vr: "" + oldTag.vr,
    };
};
//# sourceMappingURL=Anon.js.map