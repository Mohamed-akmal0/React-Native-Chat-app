import "react-native-get-random-values";
import nacl from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";
import * as SecureStore from "expo-secure-store";

type KeyPair = { publicKey: string; privateKey: string };

const storageKey = (userId: string) => `e2e_private_${userId}`;

let cachedPrivateKey: string | null = null;

const publicKeyFromPrivate = (privateKey: string) =>
  encodeBase64(
    nacl.box.keyPair.fromSecretKey(decodeBase64(privateKey)).publicKey,
  );

const generateKeyPair = (): KeyPair => {
  const pair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(pair.publicKey),
    privateKey: encodeBase64(pair.secretKey),
  };
};

const savePrivateKey = async (userId: string, privateKey: string) => {
  await SecureStore.setItemAsync(storageKey(userId), privateKey);
};

const loadPrivateKey = async (userId: string) => {
  return SecureStore.getItemAsync(storageKey(userId));
};

export const ensureKeyPair = async (userId: string): Promise<KeyPair> => {
  if (!userId) {
    throw new Error("Cannot ensure key pair without a user id");
  }

  const existingPrivateKey = await loadPrivateKey(userId);
  if (existingPrivateKey) {
    cachedPrivateKey = existingPrivateKey;
    return {
      privateKey: existingPrivateKey,
      publicKey: publicKeyFromPrivate(existingPrivateKey),
    };
  }

  const generatedPair = generateKeyPair();
  await savePrivateKey(userId, generatedPair.privateKey);
  cachedPrivateKey = generatedPair.privateKey;
  return generatedPair;
};

export async function getPrivateKey(userId: string | any) {
  if (cachedPrivateKey) return cachedPrivateKey;
  const stored = await SecureStore.getItemAsync(storageKey(userId));
  cachedPrivateKey = stored;
  return stored;
}

export function clearPrivateKeyCache() {
  cachedPrivateKey = null;
}

//encrypting message
export const encryptMessage = (
  message: string,
  receiverPublicKeyB64: any,
  senderSecretKeyB64: any,
) => {
  try {
    // ! decode when going into Nacl, encode when storing or sending the result
    const recieverPublicKey: any = decodeBase64(receiverPublicKeyB64);
    const senderSecretKey: any = decodeBase64(senderSecretKeyB64);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUnit8 = decodeUTF8(message);
    const encrypted = nacl.box(
      messageUnit8,
      nonce,
      recieverPublicKey,
      senderSecretKey,
    );
    return {
      cipherText: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
    };
  } catch (err: any) {
    console.log(err instanceof Error, err.message, String(err)); // actual reason
  }
};

export const decryptMessage = async (
  cipherText: string,
  nounceB64: string,
  senderPublicKeyB64: string,
  userId: string | undefined,
) => {
  try {
    const mySecretKey: any = await getPrivateKey(userId);
    const decryptedMessage = nacl.box.open(
      decodeBase64(cipherText),
      decodeBase64(nounceB64),
      decodeBase64(senderPublicKeyB64),
      decodeBase64(mySecretKey),
    );
    if (!decryptedMessage) throw new Error("Failed to decrypt");
    return encodeUTF8(decryptedMessage);
  } catch (error) {
    console.log("err in decrypt message", error);
    return;
  }
};
