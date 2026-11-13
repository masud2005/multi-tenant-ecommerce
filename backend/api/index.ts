import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express, type Request, type Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

let serverPromise: Promise<Express> | undefined;

function getServer(): Promise<Express> {
  if (!serverPromise) {
    const server = express();
    server.use(express.json({ limit: '10mb' }));
    server.use(express.urlencoded({ limit: '10mb', extended: true }));
    serverPromise = NestFactory.create(AppModule, new ExpressAdapter(server), {
      bodyParser: false,
    })
      .then(async (app) => {
        configureApp(app);
        await app.init();
        return server;
      })
      .catch((error: unknown) => {
        serverPromise = undefined;
        throw error;
      });
  }
  return serverPromise;
}

export default async function handler(
  request: Request,
  response: Response,
): Promise<void> {
  const server = await getServer();
  server(request, response);
}
