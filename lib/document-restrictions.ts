export interface DocumentRestriction {
  allowedExtensions: string[]; // e.g. [".pdf", ".jpg", ".jpeg"]
  allowedMimeTypes: string[];   // e.g. ["application/pdf", "image/jpeg", "image/jpg"]
  description: string;          // e.g. "Only PDF or JPEG/JPG files are allowed"
}

export const DOCUMENT_RESTRICTIONS: Record<string, DocumentRestriction> = {
  "Birth Certificate": {
    allowedExtensions: [".pdf", ".jpg", ".jpeg"],
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg"],
    description: "Only PDF or JPEG/JPG files are allowed",
  },
  "Student Photo": {
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png"],
    description: "Only JPEG, JPG, or PNG image files are allowed",
  },
  "Transfer Certificate": {
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"],
    description: "Only PDF files are allowed",
  },
  "Previous School Report Card": {
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"],
    description: "Only PDF files are allowed",
  },
};

// Fallback for document types not explicitly defined above
export const DEFAULT_RESTRICTION: DocumentRestriction = {
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
  allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
  description: "Only PDF, JPG, JPEG, or PNG files are allowed",
};

export function getRestrictionForDocumentType(name: string): DocumentRestriction {
  return DOCUMENT_RESTRICTIONS[name] || DEFAULT_RESTRICTION;
}
