import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Image
} from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { Skeleton } from '@components/Skeleton';
import { spacing, typography, radius } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore } from '@store/useAppStore';
import { fetchNews, NewsArticle } from '@services/newsApi';

export const NewsScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = mode === 'olympics' ? 'Olympic hockey' : 'NHL hockey';
      const list = await fetchNews(query);
      setArticles(list);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const incrementNewsRead = useAppStore(state => state.incrementNewsRead);
  const openArticle = (url: string) => {
    if (!url) return;
    incrementNewsRead();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <IceBackground>
      <ScreenHeader
        title="Notícias"
        subtitle={undefined}
        icon="newspaper-outline"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.skeletons}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton height={100} style={{ borderRadius: radius.sm }} />
                <Skeleton height={14} style={{ marginTop: spacing.sm }} />
                <Skeleton height={12} style={{ marginTop: 4, width: '70%' }} />
              </View>
            ))}
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Nenhuma notícia no momento</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Configure GNEWS_API_KEY ou NEWS_API_KEY no .env do servidor para notícias reais.
            </Text>
          </View>
        ) : (
          articles.map((article, index) => (
            <TouchableOpacity
              key={`${article.url}-${index}`}
              style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => openArticle(article.url)}
            >
              {article.urlToImage ? (
                <Image source={{ uri: article.urlToImage }} style={[styles.thumb, { backgroundColor: colors.border }]} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.border }]} />
              )}
              <View style={styles.cardBody}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {article.title}
                </Text>
                {article.description ? (
                  <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                    {article.description}
                  </Text>
                ) : null}
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  skeletons: { gap: spacing.md },
  skeletonCard: { marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumb: {
    width: 100,
    height: 100,
  },
  thumbPlaceholder: { opacity: 0.5 },
  cardBody: { flex: 1, padding: spacing.sm, justifyContent: 'space-between' },
  title: {
    ...typography.subtitle,
    fontSize: 14,
  },
  description: {
    ...typography.caption,
    marginTop: 4,
  },
  date: {
    ...typography.caption,
    marginTop: 4,
    fontSize: 11,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.subtitle,
  },
  emptySub: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
