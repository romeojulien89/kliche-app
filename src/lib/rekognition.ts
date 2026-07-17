import "server-only";
import { RekognitionClient } from "@aws-sdk/client-rekognition";

export function createRekognitionClient() {
  return new RekognitionClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function collectionIdForEvent(eventId: string): string {
  return `kliche-${eventId}`;
}

export function externalIdForPhoto(photoId: string): string {
  return `photo-${photoId}`;
}

export function externalIdForGuest(guestId: string): string {
  return `guest-${guestId}`;
}

export function photoIdFromExternalId(externalId: string): string | null {
  return externalId.startsWith("photo-") ? externalId.slice("photo-".length) : null;
}

export function guestIdFromExternalId(externalId: string): string | null {
  return externalId.startsWith("guest-") ? externalId.slice("guest-".length) : null;
}
