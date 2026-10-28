import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {request, isApiError} from '../../api/client';
import {ErrorState} from '../../components/ErrorState';
import {useDirection, rtlDirectionStyle} from '../../i18n/useDirection';
import {emitAuditEvent} from '../../audit/auditEmitter';

/**
 * US-018: Fetches a section's content via API-005
 * (GET /api/v1/sections/{sectionId}/content) through the single F2 client,
 * and renders ErrorState on failure instead of a blank screen (US-006).
 */

export interface SectionScreenProps {
  sectionId: 'explore' | 'map' | 'plan';
}

interface SectionContentResponse {
  sectionId: string;
  // Placeholder passthrough object per API-005 - schema TBD pending backend
  // documentation (Specifications Section 5).
  content: Record<string, unknown>;
}

export function SectionScreen({sectionId}: SectionScreenProps): React.JSX.Element {
  const {t} = useTranslation();
  const direction = useDirection();
  const [content, setContent] = useState<SectionContentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(false);
    emitAuditEvent('nav.screen.load.start', {route: `sections/${sectionId}`});
    try {
      const response = await request<SectionContentResponse>({
        url: `/api/v1/sections/${sectionId}/content`,
        method: 'GET',
      });
      setContent(response);
      emitAuditEvent('nav.screen.load.success', {route: `sections/${sectionId}`});
    } catch (err) {
      const reasonCode = isApiError(err) ? err.reasonCode : 'UNKNOWN';
      emitAuditEvent('nav.screen.load.failure', {
        route: `sections/${sectionId}`,
        errorCode: reasonCode,
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  if (error) {
    return <ErrorState onRetry={fetchContent} route={`sections/${sectionId}`} />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>{t('section.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, direction === 'RTL' ? rtlDirectionStyle : undefined]}>
      <Text style={styles.title}>{sectionId}</Text>
      {/* Placeholder content rendering - actual schema pending backend docs (Section 5). */}
      <Text style={styles.body}>{JSON.stringify(content?.content ?? {})}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#757575',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  body: {
    fontSize: 14,
    color: '#424242',
  },
});

export default SectionScreen;
