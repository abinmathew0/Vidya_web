'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { remark } from 'remark';
import html from 'remark-html';
import CommentSection from '../../components/CommentSection';
import LikeButton from '../../components/LikeButton';
import { useSession } from 'next-auth/react';

interface ArticleProps {
  frontmatter: {
    title: string;
    date: string;
  };
  content: string;
}

export default function Article() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [article, setArticle] = useState<ArticleProps | null>(null);
  const [comments, setComments] = useState<{ id: string; text: string; author: string }[]>([]);

  // Ensure id is a string, even if useParams returns a string[]
  const articleId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    // Fetch article data
    const fetchArticle = async () => {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();

      if (res.ok) {
        const processedContent = await remark().use(html).process(data.content);
        setArticle({
          frontmatter: data.frontmatter,
          content: processedContent.toString(),
        });
      }
    };

    // Fetch comments
    const fetchComments = async () => {
      const res = await fetch(`/api/comments/${articleId}`);
      const data = await res.json();
      setComments(data);
    };

    fetchArticle();
    fetchComments();
  }, [articleId]);

  const handleCommentSubmit = async (comment: string) => {
    if (session) {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          comment,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prevComments) => [...prevComments, newComment]);
      }
    } else {
      alert('You must be logged in to comment.');
    }
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4 bg-lightCream mt-16 flex justify-center"> {/* Centering the content */}
      <div className="w-full lg:w-8/12 xl:w-7/12 space-y-6"> {/* 70% width on larger screens */}
        <h1 className="text-4xl font-extrabold text-darkRed mb-4">{article.frontmatter.title}</h1>
        <p className="mb-4 text-burntOrange">{article.frontmatter.date}</p>
        <div className="prose lg:prose-xl text-darkRed" dangerouslySetInnerHTML={{ __html: article.content }} />

        <div className="mt-6">
          <LikeButton initialLikes={0} articleId={articleId} /> 
        </div>

        <div className="mt-8">
          <CommentSection comments={comments} onCommentSubmit={handleCommentSubmit} />
        </div>
      </div>
    </div>
  );
}
