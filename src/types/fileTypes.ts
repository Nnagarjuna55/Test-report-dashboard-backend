export interface FileItem {
  isFolder: boolean;
  name: string;
  path: string;
  size: number;
  lastModified?: string;
  extension?: string;
}

export interface DirectoryContents {
  items: FileItem[];
  currentPath: string;
  parentPath?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DownloadResponse {
  filename: string;
  contentType: string;
  size: number;
}
