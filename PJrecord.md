.
├── **tests** # 테스트 파일 폴더
│ └── testcode.test.js # API 테스트 코드 작성
├── controllers # 비즈니스 로직을 처리하는 컨트롤러
│ ├── commentController.js
│ ├── postController.js
│ └── userController.js
├── middlewares # 인증 및 기타 미들웨어
│ └── authenticate.js # JWT 토큰을 검증하는 미들웨어
├── models # MongoDB 스키마 및 모델 정의
│ ├── Comment.js
│ ├── Post.js
│ ├── User.js
│ └── userModel.js # (중복된 User.js, 정리 필요)
├── routes # 라우터 정의
│ ├── commentRoutes.js
│ ├── postRoutes.js
│ └── userRoutes.js
├── index.js # 애플리케이션 진입점
└── package.json # 프로젝트 설정 및 의존성 관리
