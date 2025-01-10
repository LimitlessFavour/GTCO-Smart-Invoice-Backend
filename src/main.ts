import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('GTCO Smart Invoice API')
    .setDescription('API documentation for GTCO Smart Invoice')
    .setVersion('1.0')
    // Core System & Authentication
    .addTag(
      'Schema',
      'API Schema, Documentation Operations and OpenAPI Specifications',
    )
    .addTag(
      'Auth',
      'Authentication, Authorization, OAuth2 Integration and Token Management',
    )

    // User & Company Management
    .addTag(
      'User',
      'User Account Management, Profile Settings and Onboarding Flow',
    )
    .addTag(
      'Company',
      'Company Profile, Business Settings and Organization Management',
    )

    // Core Business Operations
    .addTag(
      'Client',
      'Client Management, Contact Information and Client Relationships',
    )
    .addTag(
      'Product',
      'Product Catalog, Inventory Management and Pricing Configuration',
    )
    .addTag(
      'Invoice',
      'Invoice Creation, Management, Payment Processing and PDF Generation',
    )
    .addTag(
      'Transactions',
      'Payment Transactions, Financial Records and Transaction History',
    )

    // Analytics & Reporting
    .addTag(
      'Analytics',
      'Business Intelligence, Financial Analytics and Performance Metrics Dashboard',
    )

    // Supporting Features
    .addTag(
      'Activities',
      'System Activity Logs, Audit Trail and User Action History',
    )
    .addTag(
      'Notifications',
      'Push Notifications, Email Alerts and Communication Preferences',
    )
    .addTag(
      'Webhooks',
      'Payment Gateway Integration, Webhook Handlers and External System Events',
    )
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
