# Inkflow - Premium Blogging Platform

A modern cloud-based blogging platform built using Next.js, Supabase Auth, and Supabase PostgreSQL that allows writers to publish stories, securely manage content, and engage with readers through a premium reading experience.

## Live Demo
🌐 https://cloud-blog-platform-lake.vercel.app

## Project Overview
Inkflow is a responsive and user-friendly publishing platform designed for seamless reading and writing. 

The application provides secure authentication, role-based access, a dedicated rich markdown editor, media sharing, and a modern responsive UI for a better user experience.

This project was developed to demonstrate:
- Frontend development using Next.js (App Router) and React.js
- Supabase Authentication (Email/Password & Google OAuth)
- Supabase PostgreSQL integration and RLS security
- Full-stack content management system
- Cloud file storage using Supabase Storage
- Responsive UI/UX design with Tailwind CSS
- Premium publishing and engagement features

## Features
- User Authentication (Login & Signup via Email/Google)
- Secure Logout Functionality
- Dedicated Rich Markdown Editor + Live Preview
- Create, Edit, Publish, and Delete Posts
- Draft Autosave
- Like & Bookmark Posts
- Commenting System
- Search + Tag Filters
- Follow Writers
- Writer Dashboard with Analytics
- Cloud Storage using Supabase (Image Uploads)
- Responsive Design for Mobile & Desktop

## Technologies Used

Frontend
- Next.js (App Router)
- React.js
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn-ui

Backend & Database
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Storage

Deployment
- Vercel

Tools
- VS Code
- GitHub
- npm

## Project Structure

Inkflow/
│
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
│
├── supabase/
│   └── schema.sql
├── next.config.ts
├── package.json
└── README.md


## Installation & Setup

1️⃣ Clone the Repository

git clone https://github.com/anushreeurao/cloud-blog-platform.git


2️⃣ Navigate to Project Directory

cd inkflow


3️⃣ Install Dependencies

npm install


4️⃣ Start the Development Server

npm run dev


## Key Functionalities

Authentication System
- Email & Password Login
- Google OAuth Integration
- User Registration
- Secure Authentication
- Persistent User Sessions

Content System
- Full Markdown Support
- Auto-saving Drafts
- SEO Optimization (Dynamic Metadata & JSON-LD)

Cloud Integration
- Data stored securely in Supabase PostgreSQL
- Row Level Security (RLS) policies implemented
- Media files stored in Supabase Storage

## Deployment
This project is deployed using Vercel.

## Author
Anushree U Rao
Final Year Engineering Student Passionate about Web Development & Cloud Applications

## License
This project is developed for educational and learning purposes.
