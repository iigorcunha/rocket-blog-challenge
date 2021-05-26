import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { dateFormat } from '../../lib/dateFormat';
import { Comments } from '../../components/comments';

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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    };
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    };
  };
  preview: boolean;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
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
    <div className={commonStyles.container}>
      <Head>
        <title>spacetraveling</title>
      </Head>
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

        <hr />
        <section className={styles.navigation}>
          {navigation?.prevPost !== null ? (
            <div className={styles.prevPost}>
              <h3>{navigation.prevPost.data.title}</h3>
              <Link href={`/post/${navigation.prevPost.uid}`}>
                <a className={styles.prevButton}>Post anterior</a>
              </Link>
            </div>
          ) : (
            <div />
          )}

          {navigation?.nextPost !== null && (
            <div className={styles.nextPost}>
              <h3>{navigation.nextPost.data.title}</h3>
              <Link href={`/post/${navigation.nextPost.uid}`}>
                <a className={styles.nextButton}>Próximo post</a>
              </Link>
            </div>
          )}
        </section>
        <Comments />
        {preview && (
          <aside className={commonStyles.previewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </div>
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

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const navigation = {
    prevPost:
      prevPost.results.length > 0
        ? {
            uid: prevPost.results[0].uid,
            data: {
              title: prevPost.results[0].data.title,
            },
          }
        : null,
    nextPost:
      nextPost.results.length > 0
        ? {
            uid: nextPost.results[0].uid,
            data: {
              title: nextPost.results[0].data.title,
            },
          }
        : null,
  };

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
      navigation,
      preview,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
