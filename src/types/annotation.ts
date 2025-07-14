export interface Annotation {
  videoTime: string; // HH:MM:SS format
  situation: string;
  recommendedAction: string;
  reason: string;
  videoFileName: string;
  timestamp: string; // ISO 8601 format
}

export interface AnnotationCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface VideoMetadata {
  url: string;
  title: string;
  duration?: number;
  annotations: Annotation[];
}

export interface VideoFile {
  name: string;
  url: string;
  isDownloading?: boolean;
  downloadProgress?: number;
  blobUrl?: string;
}