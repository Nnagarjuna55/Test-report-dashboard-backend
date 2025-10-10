import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

export const requestLogger = morgan('combined', {
  stream: {
    write: (message: string) => {
      console.log(message.trim());
    }
  }
});

export const customLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};
