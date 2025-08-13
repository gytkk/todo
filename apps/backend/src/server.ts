import { buildApp } from './app.js';

const start = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const app = await buildApp({
      logger: {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        ...(isProduction 
          ? {
              // Production 설정: 구조화된 JSON 로그
              redact: ['req.headers.authorization'], // 민감한 정보 제거
              serializers: {
                req: (req) => ({
                  method: req.method,
                  url: req.url,
                  id: req.id,
                }),
                res: (res) => ({
                  statusCode: res.statusCode,
                }),
              },
            }
          : {
              // Development 설정: 읽기 쉬운 형식
              transport: {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:mm:ss',
                  ignore: 'pid,hostname',
                  colorize: true,
                  singleLine: false,
                },
              },
            }
        ),
      },
    });

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    const address = app.server.address();
    const portUsed = typeof address === 'object' ? address?.port : port;

    console.log(`Server is running on http://localhost:${portUsed}`);
    if (process.env.ENABLE_SWAGGER === 'true') {
      console.log(`API documentation available at http://localhost:${portUsed}/docs`);
    }
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
