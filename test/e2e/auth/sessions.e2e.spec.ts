import {Server} from 'net';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';

import {SessionResponseDto} from '@modules/auth/api/dtos/session.dto';

import {
  UNVERIFIED_USER_EMAIL,
  UNVERIFIED_USER_PASSWORD,
  VERIFIED_USER_EMAIL,
  VERIFIED_USER_PASSWORD,
} from '../../setup/constants';
import {getApp} from '../../setup/e2e.setup';

describe('AuthController - Sessions', () => {
  let httpServer: Server;

  beforeAll(async () => {
    httpServer = getApp().getHttpServer();
  });

  describe('/auth/sessions (GET)', () => {
    let verifiedAgent1: TestAgent;
    let verifiedAgent2: TestAgent;
    let unverifiedAgent: TestAgent;

    beforeEach(async () => {
      // Login verified user - Session 1
      verifiedAgent1 = request.agent(httpServer);
      await verifiedAgent1
        .post('/auth/login')
        .send({email: VERIFIED_USER_EMAIL, password: VERIFIED_USER_PASSWORD})
        .expect(200);

      // Login verified user - Session 2
      verifiedAgent2 = request.agent(httpServer);
      await verifiedAgent2
        .post('/auth/login')
        .send({email: VERIFIED_USER_EMAIL, password: VERIFIED_USER_PASSWORD})
        .expect(200);

      // Login unverified user
      unverifiedAgent = request.agent(httpServer);
      await unverifiedAgent
        .post('/auth/login')
        .send({email: UNVERIFIED_USER_EMAIL, password: UNVERIFIED_USER_PASSWORD})
        .expect(200);
    });

    it('should return all active sessions, marking the current one', async () => {
      const response = await verifiedAgent1.get('/auth/sessions').expect(200);

      const sessions: SessionResponseDto[] = response.body;
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThanOrEqual(2);

      const currentSessions = sessions.filter((s) => s.isCurrent === true);
      expect(currentSessions).toHaveLength(1);
      const currentSession = currentSessions[0];
      expect(currentSession).toBeDefined();
      expect(currentSession.isCurrent).toBe(true);

      const nonCurrentSessions = sessions.filter((s) => s.isCurrent === false);
      expect(nonCurrentSessions.length).toBeGreaterThanOrEqual(1);
      nonCurrentSessions.forEach((session) => {
        expect(session.isCurrent).toBe(false);
      });

      const expectedSessionStructure = {
        id: expect.any(String),
        ip: expect.any(String),
        userAgent: expect.any(String),
        deviceType: expect.any(String),
        clientDescription: expect.any(String),
        clientLocation: expect.any(String),
        createdAt: expect.any(String),
        lastSeenAt: expect.any(String),
        isCurrent: expect.any(Boolean),
      };

      // Check structure and validity of all returned sessions
      sessions.forEach((session) => {
        expect(session).toEqual(expect.objectContaining(expectedSessionStructure));
        expect(session.id.length).toBeGreaterThan(0);
        expect(Date.parse(session.createdAt)).not.toBeNaN();
        expect(Date.parse(session.lastSeenAt)).not.toBeNaN();
      });

      // Verify making the request with the second agent also works
      const response2 = await verifiedAgent2.get('/auth/sessions').expect(200);
      const sessions2: SessionResponseDto[] = response2.body;
      expect(sessions2.length).toBeGreaterThanOrEqual(2);
      const currentSessions2 = sessions2.filter((s) => s.isCurrent === true);
      expect(currentSessions2).toHaveLength(1);
      // Verify agent 2's current session ID is different
      expect(currentSessions2[0].id).not.toEqual(currentSession.id);
    });

    it('should return 403 Forbidden for an unverified user', async () => {
      await unverifiedAgent
        .get('/auth/sessions')
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toMatch(/Email not verified/i);
        });
    });

    it('should return 401 Unauthorized if the user is not logged in', async () => {
      await request(httpServer)
        .get('/auth/sessions')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toMatch(/Unauthorized/i);
        });
    });
  });

  describe('/auth/sessions/:sessionId (DELETE)', () => {
    let verifiedAgent1: TestAgent; // Agent making the revoke request
    let verifiedAgent2: TestAgent; // Agent whose session will be revoked
    let unverifiedAgent: TestAgent;
    let sessionToRevokeId: string | null = null;
    let currentSessionId: string | null = null;

    beforeEach(async () => {
      // Login verified user - Session 1
      verifiedAgent1 = request.agent(httpServer);
      await verifiedAgent1
        .post('/auth/login')
        .send({email: VERIFIED_USER_EMAIL, password: VERIFIED_USER_PASSWORD})
        .expect(200);

      // Login verified user - Session 2
      verifiedAgent2 = request.agent(httpServer);
      await verifiedAgent2
        .post('/auth/login')
        .send({email: VERIFIED_USER_EMAIL, password: VERIFIED_USER_PASSWORD})
        .expect(200);

      // Login unverified user
      unverifiedAgent = request.agent(httpServer);
      await unverifiedAgent
        .post('/auth/login')
        .send({email: UNVERIFIED_USER_EMAIL, password: UNVERIFIED_USER_PASSWORD})
        .expect(200);

      // Get sessions using agent 1 to identify IDs
      const response = await verifiedAgent1.get('/auth/sessions').expect(200);
      const sessions: SessionResponseDto[] = response.body;

      const currentSession = sessions.find((s) => s.isCurrent);
      const nonCurrentSession = sessions.find((s) => !s.isCurrent);

      // Ensure we have two sessions
      expect(currentSession).toBeDefined();
      expect(nonCurrentSession).toBeDefined();

      currentSessionId = currentSession!.id;
      sessionToRevokeId = nonCurrentSession!.id;
    });

    it('should revoke another session for the authenticated user', async () => {
      expect(sessionToRevokeId).toBeDefined();

      await verifiedAgent1
        .delete(`/auth/sessions/${sessionToRevokeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Session revoked.');
        });

      // Verify the session is gone
      const responseAfter = await verifiedAgent1.get('/auth/sessions').expect(200);
      const sessionsAfter: SessionResponseDto[] = responseAfter.body;
      const revokedSession = sessionsAfter.find((s) => s.id === sessionToRevokeId);
      expect(revokedSession).toBeUndefined();
      // Ensure the current session still exists
      expect(sessionsAfter.some((s) => s.id === currentSessionId)).toBe(true);
    });

    it('should fail with 409 Conflict when trying to revoke the current session', async () => {
      expect(currentSessionId).toBeDefined();

      await verifiedAgent1
        .delete(`/auth/sessions/${currentSessionId}`)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toMatch(/Cannot revoke the current session/i);
        });
    });

    it('should fail with 404 Not Found for a non-existent session ID', async () => {
      const nonExistentId = '00000000000000000000000000000000'; // 32 chars long

      await verifiedAgent1
        .delete(`/auth/sessions/${nonExistentId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toMatch(/Session not found or expired/i);
        });
    });

    it('should fail with 400 Bad Request for an invalid session ID format (too short)', async () => {
      const invalidId = 'invalid-id';

      await verifiedAgent1
        .delete(`/auth/sessions/${invalidId}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringMatching(/sessionId must be longer than or equal to 32 characters/i),
            ]),
          );
        });
    });

    it('should fail with 400 Bad Request for an invalid session ID format (too long)', async () => {
      const invalidId = 'a'.repeat(33); // 33 chars long

      await verifiedAgent1
        .delete(`/auth/sessions/${invalidId}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringMatching(/sessionId must be shorter than or equal to 32 characters/i),
            ]),
          );
        });
    });

    it('should fail with 403 Forbidden if the user is not email-verified', async () => {
      await unverifiedAgent
        .delete(`/auth/sessions/${sessionToRevokeId}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toMatch(/Email not verified/i);
        });
    });

    it('should fail with 401 Unauthorized if the user is not logged in', async () => {
      expect(sessionToRevokeId).toBeDefined();

      await request(httpServer)
        .delete(`/auth/sessions/${sessionToRevokeId}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toMatch(/Unauthorized/i);
        });
    });
  });
});
