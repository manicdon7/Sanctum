import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';

import { lightColors, darkColors, palette } from '@/core/theme/colors';
import { typography, fontFamilies, fontSize } from '@/core/theme/typography';
import { spacing, radius } from '@/core/theme/spacing';
import { decryptFile } from '@/core/encryption/crypto';
import { useAppStore } from '@/core/stores/appStore';

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'voice' | 'document';
  encryptedUri: string;
  thumbnailUri: string | null;
  name: string;
  sizeBytes: number;
  durationMs: number | null;
  recordedAt: Date;
}

interface MediaCardProps {
  media: MediaItem;
  onPress: () => void;
  onDelete: () => void;
}

export function MediaCard({ media, onPress, onDelete }: MediaCardProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const encryptionKey = useAppStore((s) => s.encryptionKey);

  const [decryptedThumb, setDecryptedThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let tempPath: string | null = null;

    async function loadThumbnail() {
      if (media.type !== 'photo' || !media.thumbnailUri || !encryptionKey) return;
      setLoading(true);
      try {
        const ext = 'jpg';
        tempPath = `${Paths.cache.uri}/decrypted_thumb_${media.id}.${ext}`;
        
        // Decrypt to temp path for displaying
        await decryptFile(media.thumbnailUri, encryptionKey, tempPath);
        setDecryptedThumb(tempPath);
      } catch (err) {
        console.warn('[MediaCard] Failed to decrypt thumbnail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadThumbnail();

    return () => {
      // Clean up decrypted temporary file immediately on unmount
      if (tempPath) {
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      }
    };
  }, [media.id, media.thumbnailUri, media.type, encryptionKey]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaIcon = () => {
    switch (media.type) {
      case 'photo':
        return 'image';
      case 'video':
        return 'video';
      case 'voice':
        return 'mic';
      case 'document':
        return 'file-text';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Thumbnail or Icon placeholder */}
      <View style={[styles.previewArea, { backgroundColor: colors.surfaceRaised }]}>
        {media.type === 'photo' && decryptedThumb ? (
          <Image source={{ uri: decryptedThumb }} style={styles.thumbnail} />
        ) : loading ? (
          <ActivityIndicator size="small" color={palette.amber} />
        ) : (
          <Feather name={getMediaIcon()} size={28} color={palette.amber} />
        )}
      </View>

      {/* Media Details */}
      <View style={styles.details}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {media.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.text.muted }]}>
            {formatSize(media.sizeBytes)}
          </Text>
          <Text style={[styles.metaDivider, { color: colors.text.muted }]}>•</Text>
          <Text style={[styles.metaText, { color: colors.text.muted }]}>
            {media.recordedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={16} color={colors.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  previewArea: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  details: {
    flex: 1,
    marginLeft: spacing[3],
    justifyContent: 'center',
  },
  name: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
  },
  metaDivider: {
    marginHorizontal: spacing[1],
    fontSize: fontSize.xs,
  },
  deleteBtn: {
    padding: spacing[2],
  },
});
