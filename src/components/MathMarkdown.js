import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';


export const MathMarkdown = ({ content }) => {
    console.log(content,"content in math markdown")
    return (
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeMathjax]}
      />
    );
  };
  