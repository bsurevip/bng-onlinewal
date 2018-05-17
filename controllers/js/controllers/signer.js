

// signer that uses witness address
let signer = {
    readSigningPaths: function(conn, address, handleLengthsBySigningPaths) {
        handleLengthsBySigningPaths({r: 88});
    },
    readDefinition: function(conn, address, handleDefinition) {
        let wallet = walletConfigData[address];
        let definition = wallet["definition"];
        handleDefinition(null, JSON.parse(definition));
    },
    sign: function(objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
        let buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
        let wallet = walletConfigData[address];
        let derivedPrivateKey = getDerivedKey(
            wallet["mnemonic_phrase"],
            wallet["passphrase"],
            0,
            wallet["is_change"],
            wallet["address_index"]
          );
        handleSignature(null, ecdsaSig.sign(buf_to_sign, derivedPrivateKey));
    }
};

