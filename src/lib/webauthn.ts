/**
 * WebAuthn ceremony helpers. Browsers speak ArrayBuffers while the API speaks
 * base64url JSON, so every binary field is converted explicitly.
 */

export interface PasskeyRegistrationOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: "public-key"; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{
    type: "public-key";
    id: string;
    transports?: AuthenticatorTransport[];
  }>;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface PasskeyRequestOptions {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
  allowCredentials?: Array<{
    type: "public-key";
    id: string;
    transports?: AuthenticatorTransport[];
  }>;
}

export interface RegistrationResult {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  transports: string[];
}

export interface AssertionResult {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
  authenticatorAttachment?: AuthenticatorAttachment;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
  );
}

export function toBase64Url(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Copy into a plain ArrayBuffer: some browsers reject Uint8Array views whose
  // backing buffer is shared.
  return bytes.slice().buffer;
}

export function prepareCreationOptions(
  options: PasskeyRegistrationOptions,
): PublicKeyCredentialCreationOptions {
  return {
    challenge: asArrayBuffer(fromBase64Url(options.challenge)),
    rp: options.rp,
    user: {
      id: asArrayBuffer(fromBase64Url(options.user.id)),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      type: "public-key",
      id: asArrayBuffer(fromBase64Url(credential.id)),
      transports: credential.transports,
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
    extensions: options.extensions,
  };
}

export function prepareRequestOptions(
  options: PasskeyRequestOptions,
): PublicKeyCredentialRequestOptions {
  return {
    challenge: asArrayBuffer(fromBase64Url(options.challenge)),
    rpId: options.rpId,
    timeout: options.timeout,
    userVerification: options.userVerification,
    allowCredentials: options.allowCredentials?.map((credential) => ({
      type: "public-key",
      id: asArrayBuffer(fromBase64Url(credential.id)),
      transports: credential.transports,
    })),
  };
}

export async function createPasskey(
  options: PasskeyRegistrationOptions,
): Promise<RegistrationResult> {
  const credential = (await navigator.credentials.create({
    publicKey: prepareCreationOptions(options),
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey creation was cancelled.");
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    credentialId: toBase64Url(credential.rawId),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    attestationObject: toBase64Url(response.attestationObject),
    transports:
      typeof response.getTransports === "function" ? response.getTransports() : [],
  };
}

export async function getPasskeyAssertion(
  options: PasskeyRequestOptions,
): Promise<AssertionResult> {
  const credential = (await navigator.credentials.get({
    publicKey: prepareRequestOptions(options),
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey sign-in was cancelled.");
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    credentialId: toBase64Url(credential.rawId),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature),
    userHandle: response.userHandle ? toBase64Url(response.userHandle) : undefined,
    authenticatorAttachment:
      (credential.authenticatorAttachment ?? undefined) as
        | AuthenticatorAttachment
        | undefined,
  };
}

/** Turns browser WebAuthn errors into short, non-technical copy. */
export function describePasskeyError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Passkey prompt was cancelled or timed out. Try again.";
    }
    if (error.name === "SecurityError") {
      return "This browser blocked the passkey prompt. Check that the site is served over HTTPS (or localhost).";
    }
    if (error.name === "InvalidStateError") {
      return "That passkey is already registered on this device.";
    }
    if (error.name === "NotSupportedError") {
      return "This device or browser does not support passkeys.";
    }
  }
  return error instanceof Error ? error.message : "Passkey operation failed. Try again.";
}
