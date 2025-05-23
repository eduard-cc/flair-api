import {faker} from '@faker-js/faker';
import {Server} from 'node:net';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';

import {Account} from '@modules/account/account.entity';
import {EMAIL_NOT_VERIFIED} from '@modules/auth/api/constants/api-messages.constants';
import {SignUpDto} from '@modules/auth/api/dtos/signup.dto';

import {getApp} from '../../setup/e2e.setup';

describe('AuthController - Login', () => {
	let httpServer: Server;

	beforeAll(async () => {
		httpServer = getApp().getHttpServer();
	});

	describe('/auth/login (POST)', () => {
		let agent: TestAgent;
		let accountCredentials: SignUpDto;

		beforeEach(async () => {
			accountCredentials = {
				name: faker.person.fullName(),
				email: faker.internet.email(),
				password: faker.internet.password({length: 10}),
			};
			await request(httpServer).post('/auth/signup').send(accountCredentials).expect(201);

			agent = request.agent(httpServer);
			await agent
				.post('/auth/login')
				.send({email: accountCredentials.email, password: accountCredentials.password})
				.expect(200);
		});

		it('should log in with correct credentials and establish session', async () => {
			const response = await agent.get('/accounts/me').expect(200);

			const account: Account = response.body;
			expect(account).toBeDefined();
			expect(account.id).toBeDefined();
			expect(account.email).toEqual(accountCredentials.email);
			expect(account.name).toEqual(accountCredentials.name);
			expect(account.password).toBeUndefined();

			const cookiesHeader = response.headers['set-cookie'];
			expect(cookiesHeader).toBeDefined();

			const sessionCookie = ([] as string[])
				.concat(cookiesHeader || [])
				.find((cookie: string) => cookie.startsWith('session='));

			expect(sessionCookie).toBeDefined();
			expect(sessionCookie).toMatch(/HttpOnly/);
			expect(sessionCookie).toMatch(/Path=\//);
			expect(sessionCookie).toMatch(/SameSite=Strict/);
			expect(sessionCookie).toMatch(/Expires=/);
		});

		it('should return 403 Forbidden when accessing email-verified route without verification', async () => {
			await agent
				.get('/auth/sessions')
				.expect(403)
				.expect((res) => {
					expect(res.body.message).toBe(EMAIL_NOT_VERIFIED);
				});
		});

		it('should fail to log in with incorrect password', async () => {
			const response = await request(httpServer)
				.post('/auth/login')
				.send({email: accountCredentials.email, password: 'incorrect-password'})
				.expect(401);
			expect(response.headers['set-cookie']).toBeUndefined();
		});

		it('should fail to log in with incorrect email', async () => {
			const response = await request(httpServer)
				.post('/auth/login')
				.send({email: 'incorrect@email.com', password: accountCredentials.password})
				.expect(401);
			expect(response.headers['set-cookie']).toBeUndefined();
		});

		it('should fail with 401 Unauthorized if email is missing', () => {
			return request(httpServer).post('/auth/login').send({password: 'password123'}).expect(401);
		});

		it('should fail with 401 Unauthorized if email is empty', () => {
			return request(httpServer).post('/auth/login').send({email: '', password: 'password123'}).expect(401);
		});

		it('should fail with 401 Unauthorized if password is missing', () => {
			return request(httpServer).post('/auth/login').send({email: accountCredentials.email}).expect(401);
		});

		it('should fail with 401 Unauthorized if password is empty', () => {
			return request(httpServer)
				.post('/auth/login')
				.send({email: accountCredentials.email, password: ''})
				.expect(401);
		});

		it('should fail with 400 Bad Request if email is not a valid email format', () => {
			return request(httpServer)
				.post('/auth/login')
				.send({email: 'not-a-valid-email', password: 'password123'})
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toEqual(
						expect.arrayContaining([expect.stringMatching(/email must be an email/i)]),
					);
				});
		});

		it('should fail with 400 Bad Request if password is too short', () => {
			return request(httpServer)
				.post('/auth/login')
				.send({email: accountCredentials.email, password: '123'})
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toEqual(
						expect.arrayContaining([
							expect.stringMatching(/password must be longer than or equal to 8 characters/i),
						]),
					);
				});
		});
	});
});
