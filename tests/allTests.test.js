require('dotenv').config({ path: '.env.test' });
console.log('JWT_SECRET:', process.env.JWT_SECRET);
const request = require('supertest');
const { createServer } = require('http');
const Client = require('socket.io-client');
const { app, server, io, connectDB, closeDB } = require('../index');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

let token;
let userId;
let postId;
let commentId;
let clientSocket;

// 임시 테스트 이미지 파일 생성
const testImagePath = path.join(__dirname, 'test-image.jpg');
beforeAll(() => {
  fs.writeFileSync(testImagePath, 'dummy image content');
});

// 테스트 후 임시 파일 삭제
afterAll(() => {
  fs.unlinkSync(testImagePath);
});

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({ email: 'test@example.com' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
  });
  console.log('Created user:', user);
  userId = user._id;
  const loginResponse = await request(app)
    .post('/users/login')
    .send({ email: 'test@example.com', password: 'password123' });
  console.log('Login Response:', loginResponse.body);
  token = loginResponse.body.token;
  console.log('Token:', token);
  if (!token) {
    throw new Error('Token not generated');
  }

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', resolve);
    });
  });
});

describe('통합 테스트', () => {
  describe('게시물 API', () => {
    it('새 게시물을 생성해야 함', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '테스트 게시물 내용',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      postId = res.body._id;
    });

    it('게시물을 수정해야 함', async () => {
      const res = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '수정된 게시물 내용',
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.content).toBe('수정된 게시물 내용');
    });

    it('게시물을 삭제해야 함', async () => {
      const res = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('글 API', () => {
    it('게시물에 댓글을 추가해야 함', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '테스트 댓글 내용',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      commentId = res.body._id;
    });

    it('게시물의 댓글을 가져와야 함', async () => {
      const res = await request(app)
        .get(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('댓글에 좋아요를 눌러야 함', async () => {
      const res = await request(app)
        .post(`/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.likes).toBe(1);
    });

    it('댓글에 답글을 추가해야 함', async () => {
      const res = await request(app)
        .post(`/comments/${commentId}/reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '테스트 답글 내용',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('parentComment');
    });
  });

  describe('Socket.io 테스트', () => {
    it('Socket.io를 통해 댓글을 수신해야 함', (done) => {
      const timeout = setTimeout(() => {
        done(new Error('Socket.io 이벤트 수신 타임아웃'));
      }, 5000);

      clientSocket.emit('new_comment', {
        content: '테스트 댓글입니다!',
        user: '테스트 유저',
      });

      clientSocket.on('receive_comment', (data) => {
        clearTimeout(timeout);
        expect(data).toEqual({
          content: '테스트 댓글입니다!',
          user: '테스트 유저',
        });
        clientSocket.disconnect();
        done();
      });
    });
  });

  describe('프로필 관리', () => {
    it('프로필 정보를 업데이트해야 함', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .field('bio', '새로운 자기소개')
        .attach('profileImage', testImagePath);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio', '새로운 자기소개');
      expect(res.body).toHaveProperty('profileImage');
    });

    it('프로필 정보를 조해야 함', async () => {
      const res = await request(app)
        .get(`/users/profile/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('bio');
      expect(res.body).toHaveProperty('profileImage');
    });
  });

  describe('팔로우/팔로워 시스템', () => {
    let otherUserId;

    beforeAll(async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      otherUserId = otherUser._id;
    });

    it('사용자를 팔로우해야 함', async () => {
      const res = await request(app)
        .post(`/users/follow/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', '팔로우 성공');
    });

    it('팔로워 목록을 조회해야 함', async () => {
      const res = await request(app)
        .get(`/users/${otherUserId}/followers`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('username', 'testuser');
    });

    it('팔로잉 목록을 조회해야 함', async () => {
      const res = await request(app)
        .get(`/users/${userId}/following`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('username', 'otheruser');
    });

    it('사용자를 언팔로우해야 함', async () => {
      const res = await request(app)
        .post(`/users/unfollow/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', '언팔로우 성공');
    });
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  if (clientSocket) {
    clientSocket.disconnect();
  }
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

console.log('JWT_SECRET:', process.env.JWT_SECRET);
