import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import * as yaml from 'js-yaml';
// import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('GTCO Smart Invoice API')
    .setDescription('API documentation for GTCO Smart Invoice')
    .setVersion('1.0')
    .addTag('Schema', 'API Schema operations')
    .addTag('Auth', '1')
    .addTag('User', '2')
    .addTag('Client', '3')
    .addTag('Invoice', '4')
    .addTag('Product', '5')
    .addTag('Company', '6')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Remove the root endpoint from documentation
  delete document.paths['/'];

  // Add schema endpoint documentation
  document.paths['/schema'] = {
    get: {
      tags: ['Schema'],
      operationId: 'getSchema',
      summary: 'Get API Schema',
      description: 'Returns the API schema in JSON or YAML format',
      parameters: [
        {
          name: 'format',
          in: 'query',
          description: 'Response format (json or yaml)',
          required: false,
          schema: {
            type: 'string',
            enum: ['json', 'yaml'],
            default: 'json',
          },
        },
      ],
      responses: {
        200: {
          description: 'API Schema',
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
            'text/yaml': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  };

  SwaggerModule.setup('api-docs', app, document);

  // Redirect root URL to /api-docs
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/') {
      res.redirect('/api-docs');
    } else {
      next();
    }
  });

  // Schema endpoint implementation
  app.use('/schema', (req: Request, res: Response) => {
    const format = req.query.format === 'yaml' ? 'yaml' : 'json';
    if (format === 'yaml') {
      res.setHeader('Content-Type', 'text/yaml');
      res.send(yaml.dump(document));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    }
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
