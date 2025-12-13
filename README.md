# SpederMath

SpederMath is a teacher-assisted, web-based mathematics learning application designed for children with autism, particularly low-functioning learners. The system focuses on early numeracy skills such as number recognition and counting through structured lessons, gamified activities, visual cues, and audio prompts.

The platform consists of:
- **Student Module** – interactive lessons and assessments
- **Teacher Dashboard** – student monitoring, progress tracking, and analytics

---

## Tech Stack

### Frontend
- **React**: 19.0.0
- **React DOM**: 19.0.0
- **Vite**: 6.2.0
- **Node.js**: 20.x (LTS)
- **npm**: 10.x
- **Tailwind CSS**: 4.1.2
- **Tailwind CSS Animate**: 1.0.7
- **Axios**: 1.8.4
- **ApexCharts**: 4.7.0
- **React ApexCharts**: 1.7.0
- **Firebase SDK**: 11.6.0
- **Framer Motion**: 12.10.0
- **JWT Decode**: 4.0.0
- **Lucide React**: 0.487.0
- **QR Code Libraries**:
  - qrcode.react 4.2.0
  - react-qr-code 2.0.15

---

### Backend
- **Java**: 17
- **Spring Boot**: 3.4.4
- **Spring Web (REST API)**
- **Spring Data JPA (Hibernate)**
- **Spring Security**
- **JWT (JJWT)**: 0.11.5
- **Swagger / OpenAPI**:
  - springdoc-openapi 2.8.5
  - springfox 3.0.0
- **Maven**: 3.9.x

---

### Database
- **PostgreSQL**: 16
- **ORM**: Hibernate
- **DDL Strategy**: hibernate.ddl-auto=update
- **Hosting**: AWS Lightsail

---

### Deployment
- **Frontend Hosting**: Firebase Hosting
- **Backend Hosting**: Fly.io
- **Database Hosting**: AWS Lightsail

---

## Deployment Instructions

### Backend (Local)

```bash
cd backend
mvn spring-boot:run
```

Backend runs at:

```
http://localhost:8080
```

---

### Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## Production Deployment

### Backend
- Built using Maven
- Deployed to Fly.io
- Public API URL:

```
https://api.spedermath.app
```

---

### Frontend
- Built using Vite
- Deployed to Firebase Hosting
- Public URL:

```
https://spedermath.app
```

---

## Demo Accounts (Existing Server)

These demo accounts are provided for system evaluation.

### Teacher Account
- **Email:** teacherdemo67@gmail.com
- **Password:** TeacherDemo123!
- **Role:** Teacher

### Student Account
- **Username:** student_demo
- **Password:** 667hu3lz
- **Role:** Student

---

## Notes
- Ensure backend CORS allows https://spedermath.app
- Demo accounts must exist in the production database
- JWT authentication is required for protected routes

---

## Academic Information
- **Institution:** Cebu Institute of Technology – University
- **Course / Term:** 2526-SEM1-IT411
- **Group Name:** g1 / g2 / g3 / g4 / g5 / g6-07
- **Year:** 2025
