import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { dateFormat } from '../../lib/dateFormat';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
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
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((acc, items) => {
    let total = acc;
    const hWords = items.heading.split(' ').length;
    total += hWords;

    const bWords = RichText.asText(items.body).split(' ').length;

    total += bWords;

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <main className={commonStyles.container}>
      <Header />
      <img
        className={styles.banner}
        src={post.data.banner.url}
        alt={post.data.title}
      />
      <div className={`${styles.Container} ${commonStyles.mainContent}`}>
        <article>
          <h2>{post.data.title}</h2>
          <div className={styles.postInfo}>
            <span>
              <FiCalendar />
              {dateFormat(post.first_publication_date)}
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {readingTime} min
            </span>
          </div>
          {post.data.content.map(content => (
            <div
              className={styles.postContainer}
              key={`${content.heading}-${Math.floor(2)}`}
            >
              <h3>{content.heading}</h3>
              <div
                className={styles.postContent}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const getPosts = response as Post;

  const post = {
    uid: getPosts.uid,
    first_publication_date: getPosts.first_publication_date,
    data: {
      title: getPosts.data.title,
      subtitle: getPosts.data.subtitle,
      banner: {
        url: getPosts.data.banner.url,
      },
      author: getPosts.data.author,
      content: getPosts.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
