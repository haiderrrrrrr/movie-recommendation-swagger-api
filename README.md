# Movie Recommendation Swagger API

A Node.js and Express REST API for a movie recommendation platform with interactive Swagger/OpenAPI documentation. The API includes user authentication, movie catalog endpoints, ratings and reviews, recommendations, search, custom lists, trailers, posts, comments, discussion boards, and admin statistics.

## Live App

https://movie-recommendation-api-murex.vercel.app

Swagger API documentation:

```text
https://movie-recommendation-api-murex.vercel.app/api-docs
```

## Features

- User registration and login with JWT authentication.
- Movie catalog CRUD endpoints.
- Movie recommendations, trending movies, top-rated movies, and similar title routes.
- Ratings and reviews.
- Likes and comments.
- Custom movie lists.
- Trailer management and sharing routes.
- Discussion boards and community posts.
- News, articles, box office, awards, and admin stats endpoints.
- Swagger API documentation.

## Tech Stack

| Part | Tech |
| --- | --- |
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB, Mongoose |
| Auth | JSON Web Tokens |
| Validation | Joi, Validator |
| Docs | Swagger UI, swagger-jsdoc |

## Screenshots

### Swagger Documentation Overview

![Swagger documentation landing page](assets/Welcome%20PAge%201.png)

![Swagger API groups overview](assets/Welcome%20PAge%202.png)

![Swagger endpoint categories](assets/Wlecome%20apge%203.png)

![Swagger schema and endpoint list](assets/Welcome%20apge%204.png)

![Swagger authentication section](assets/Welcome%20apge%205.png)

![Swagger route details](assets/Welcome%20apge%206.png)

### User Registration

![User signup request](assets/2.%20Signup.png)

### User Login

![User login request](assets/3.%20login.png)

### Bearer Token Authorization

![Swagger authorize token added](assets/3.%20Authorization%20token%20added.png)

### User Profile

![Get authenticated user profile](assets/4.%20Get%20USer%20Profile.png)

![Update authenticated user profile](assets/5.%20Updating%20SUer%20Profile.png)

## Project Structure

```text
.
|-- config/          # Database and Swagger configuration
|-- controllers/     # Route handlers
|-- middleware/      # Auth and access middleware
|-- models/          # Mongoose schemas
|-- routes/          # Express route definitions and Swagger comments
|-- utils/           # Shared helpers
|-- api/index.js     # Vercel API entrypoint
|-- server.js        # Express app
|-- vercel.json      # Vercel routing config
`-- README.md
```

## Environment Variables

Create a `.env` file in the project root.

```env
MOVIE_DB_URI=mongodb+srv://<username>:<password>@<cluster-url>/movie-recommendation?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
API_BASE_URL=http://localhost:5000
CLIENT_ORIGIN=http://localhost:3000
DNS_SERVERS=8.8.8.8,1.1.1.1
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Required:

- `MOVIE_DB_URI`
- `JWT_SECRET`

Optional:

- `API_BASE_URL`
- `CLIENT_ORIGIN`
- `DNS_SERVERS`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WHATSAPP_FROM`

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

Swagger docs:

```text
http://localhost:5000/api-docs
```

## Swagger Documentation Workflow

Use Swagger UI to study and test the API directly from the browser.

1. Open the documentation:

```text
Local: http://localhost:5000/api-docs
Production: https://movie-recommendation-api-murex.vercel.app/api-docs
```

2. Create a user from **Users > POST /api/users/register**.

Use this sample signup body:

```json
{
  "name": "Haider",
  "email": "haider@example.com",
  "username": "haider",
  "password": "Haider123!"
}
```

3. Log in from **Users > POST /api/users/login**.

Use the username or email with the same password:

```json
{
  "emailOrUsername": "haider",
  "password": "Haider123!"
}
```

4. Copy the `token` value from the login response.

5. Click **Authorize** at the top of Swagger UI.

6. Paste the token in this format:

```text
Bearer <token>
```

7. Click **Authorize**, close the popup, then test protected routes such as:

```text
GET /api/users/profile
POST /api/users/create-profile
GET /api/users/wishlist
POST /api/users/wishlist
```

Routes marked with a lock icon require the bearer token. Public routes such as registration, login, health checks, and selected catalog/search endpoints can be tested without authorization.

### Swagger Route Requirements

Some Swagger operations depend on data created by earlier operations.

| Requirement | Routes / Groups | What to do first |
| --- | --- | --- |
| No token required | `POST /api/users/register`, `POST /api/users/login`, `GET /health`, `GET /api-docs`, `GET /api-docs/swagger.json` | Use these before authorization. |
| User token required | Profile, wishlist, ratings, reviews, likes, comments, custom lists, discussion boards, posts, search, recommendations, trailers, news, box office, and movie catalog routes that show a lock icon | Register, login, copy the JWT token, then authorize with `Bearer <token>`. |
| Admin role required | Movie create/update/delete routes, trailer create/update/delete routes, discussion board create/update/delete routes, and every `/api/admin-stats/*` route | Login with a user whose JWT contains `isAdmin: true`. Normal signup users are not admins by default. |
| Existing `movieId` required | Wishlist, ratings/reviews, likes/comments, trailers, recommendations by similar movie, news/box-office updates, and custom-list movie operations | Create or fetch a movie first, then copy its MongoDB `_id` / `movieId`. |
| Existing custom list required | Follow/unfollow, add/remove movie, update/delete/share custom list routes | Create a custom list first, then copy its `_id` as `listId` or route `id`. |
| Existing discussion board required | Join, unfollow, read, update, and delete discussion board routes | Create or list discussion boards first, then copy a board `_id`. |
| Existing post required | Update/read post, post comments, post likes, and post comment listing routes | Create or list posts first, then use the returned `postId`. |
| Existing trailer required | Update/delete/share trailer routes | Create or list trailers first, then copy the trailer `_id` as `trailerId`. |

Admin-only endpoints return `403 Access denied. Admins only.` when the token belongs to a normal user. A normal signup through Swagger creates `isAdmin: false`, so admin testing requires promoting that user in MongoDB Atlas or using a seeded/admin account.

## MongoDB Atlas

For a hosted database, create a MongoDB Atlas cluster and use the Node.js connection string as `MOVIE_DB_URI`.

Example:

```text
mongodb+srv://<username>:<password>@<cluster-url>/movie-recommendation?retryWrites=true&w=majority
```

## Vercel Deployment

This API can run on Vercel using the included `api/index.js` and `vercel.json`.

Set these environment variables in Vercel:

```text
MOVIE_DB_URI
JWT_SECRET
API_BASE_URL
```

Production URL:

```text
https://movie-recommendation-api-murex.vercel.app
```

Deploy:

```bash
vercel --prod
```

Useful checks:

```text
GET /
GET /health
GET /api-docs
```

## API Groups

| Base Route | Description |
| --- | --- |
| `/api/users` | User registration, login, profile, and wishlist |
| `/api/movies` | Movie catalog |
| `/api/recommendations` | Recommendations, trending, top-rated, and similar titles |
| `/api/rating-reviews` | Ratings and reviews |
| `/api/likes` | Movie likes |
| `/api/comments` | Movie comments |
| `/api/custom-lists` | Custom movie lists |
| `/api/trailers` | Trailer management and sharing |
| `/api/discussion-boards` | Discussion boards |
| `/api/posts` | Community posts |
| `/api/search` | Search endpoints |
| `/api/news-and-updates` | News and article data |
| `/api/box-office-awards` | Box office and awards data |
| `/api/admin-stats` | Admin dashboard stats |

## Scripts

Run the API:

```bash
npm start
```

Run in development mode:

```bash
npm run dev
```

Run tests:

```bash
npm test
```
