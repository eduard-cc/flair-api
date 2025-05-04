import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {ConfigurationService} from '@core/config/config.service';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigurationService],
			useFactory: (config: ConfigurationService) => ({
				type: 'postgres',
				host: config.get('DB_HOST'),
				port: config.get('DB_PORT'),
				username: config.get('DB_USERNAME'),
				password: config.get('DB_PASSWORD'),
				database: config.get('DB_NAME'),
				synchronize: config.get('DB_SYNCHRONIZE'),
				autoLoadEntities: true,
				dropSchema: config.get('NODE_ENV') === 'test',
			}),
		}),
	],
})
export class DatabaseModule {}
