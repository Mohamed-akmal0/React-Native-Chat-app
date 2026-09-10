import "react-native-get-random-values";
import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
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
  console.log('generated pair', generatedPair)
  await savePrivateKey(userId, generatedPair.privateKey);
  cachedPrivateKey = generatedPair.privateKey;
  return generatedPair;
};

export async function getPrivateKey(userId: string) {
  if (cachedPrivateKey) return cachedPrivateKey;
  const stored = await SecureStore.getItemAsync(storageKey(userId));
  cachedPrivateKey = stored;
  return stored;
}

export function clearPrivateKeyCache() {
  cachedPrivateKey = null;
}
