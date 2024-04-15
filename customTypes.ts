export type CapturedSource = {
  id: string;
  display_id: string;
  name: string;
};

export type UploadResult = {
  status: 'Uploaded' | 'Failed';
  uploadedZipFileName: string;
};
