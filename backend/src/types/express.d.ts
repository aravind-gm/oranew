declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: any;
      };
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }
  }
}

export {};

