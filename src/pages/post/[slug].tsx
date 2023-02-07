import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { FiUser, FiClock } from 'react-icons/fi';
import { AiOutlineCalendar } from 'react-icons/ai';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const getEstimatedReadingTime = (): number => {
    const regex = /[^\w]/;

    const totalWords = post.data.content.reduce((acc, item) => {
      const totalWordsInHeading = item.heading?.split(regex).length ?? 0;

      const totalWordsInBody = item.body.reduce((bodyAcc, bodyItem) => {
        return bodyAcc + bodyItem.text.split(regex).length;
      }, 0);

      return acc + totalWordsInHeading + totalWordsInBody;
    }, 0);

    return Math.round(totalWords / 200);
  };

  return (
    <article className={styles.container}>
      <img src={post.data.banner.url} alt={post.data.title} />
      <h1>{post.data.title}</h1>
      <div className={styles.info}>
        <div>
          <span>
            <AiOutlineCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
          </span>
          <span>
            <FiUser />
            <span>{post.data.author}</span>
          </span>
          <span>
            <FiClock />
            <span>{getEstimatedReadingTime()} min</span>
          </span>
        </div>
      </div>
      <div className={styles.content}>
        {post.data.content.map(content => (
          <div key={(Math.random() * 9999999).toString()}>
            <h2>{content.heading}</h2>
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});

  const posts = await prismic.getByType('posts');

  const slugParams = posts.results.map(res => {
    return {
      params: {
        slug: res.uid,
      },
    };
  });

  return {
    paths: slugParams,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(params.slug), {});

  return {
    props: { post: response },
  };
};
