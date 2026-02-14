/**
 * ============================================================================
 * INTEGRATED CHANNELS PAGE
 * Bulletproof channels with auto profile integration
 * Automatically shows channels for user's faculty, department, and level
 * ============================================================================
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '@/context/AuthContext';
import integratedChannelsApi from '@/services/integratedChannelsApi';

export default function ChannelsPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myChannels, setMyChannels] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChannels();
    autoJoinChannels();
  }, []);

  const autoJoinChannels = async () => {
    try {
      // Auto-join channels based on user profile
      await integratedChannelsApi.autoJoinChannels();
      console.log('✅ Auto-joined channels');
    } catch (error) {
      console.error('Error auto-joining channels:', error);
    }
  };

  const loadChannels = async () => {
    try {
      setLoading(true);

      const [myChannelsData, recommendedData] = await Promise.all([
        integratedChannelsApi.getMyChannels(),
        integratedChannelsApi.getRecommendedChannels()
      ]);

      setMyChannels(myChannelsData.channels || []);
      setRecommended(recommendedData.recommended || []);

    } catch (error) {
      console.error('Error loading channels:', error);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChannels();
    setRefreshing(false);
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      await integratedChannelsApi.joinChannel(channelId);
      Alert.alert('Success', 'Joined channel successfully');
      await loadChannels();
    } catch (error: any) {
      console.error('Error joining channel:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to join channel');
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global': return 'globe';
      case 'faculty': return 'school';
      case 'department': return 'business';
      case 'level': return 'book';
      default: return 'chatbubbles';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global': return '#1e88e5';
      case 'faculty': return '#4caf50';
      case 'department': return '#ff9800';
      case 'level': return '#e91e63';
      default: return '#757575';
    }
  };

  const renderMyChannel = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => router.push(`/channel/${item.id}`)}
    >
      <View style={[styles.scopeIcon, { backgroundColor: getScopeColor(item.scope) }]}>
        <Ionicons name={getScopeIcon(item.scope)} size={24} color="#fff" />
      </View>
      
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.channelDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.channelMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.metaText}>{item.memberCount}</Text>
          </View>
          <View style={styles.scopeBadge}>
            <Text style={styles.scopeText}>{item.scope}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  const renderRecommendedChannel = ({ item }: { item: any }) => (
    <View style={styles.channelCard}>
      <View style={[styles.scopeIcon, { backgroundColor: getScopeColor(item.scope) }]}>
        <Ionicons name={getScopeIcon(item.scope)} size={24} color="#fff" />
      </View>
      
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.channelDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => handleJoinChannel(item.id)}
      >
        <Ionicons name="add-circle" size={28} color="#4caf50" />
      </TouchableOpacity>
    </View>
  );

  const filteredChannels = myChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading channels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <Text style={styles.headerSubtitle}>
          Auto-joined based on your profile
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showRecommended && styles.tabActive]}
          onPress={() => setShowRecommended(false)}
        >
          <Text style={[styles.tabText, !showRecommended && styles.tabTextActive]}>
            My Channels ({myChannels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showRecommended && styles.tabActive]}
          onPress={() => setShowRecommended(true)}
        >
          <Text style={[styles.tabText, showRecommended && styles.tabTextActive]}>
            Recommended ({recommended.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={showRecommended ? recommended : filteredChannels}
        keyExtractor={(item) => item.id}
        renderItem={showRecommended ? renderRecommendedChannel : renderMyChannel}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={showRecommended ? "search" : "chatbubbles-outline"}
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              {showRecommended
                ? 'No recommended channels'
                : 'No channels yet'}
            </Text>
            {!showRecommended && (
              <Text style={styles.emptySubtext}>
                Channels will appear automatically
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  header: {
    backgroundColor: '#1e88e5',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: '#1e88e5'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  tabTextActive: {
    color: '#fff'
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12
  },
  scopeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  channelInfo: {
    flex: 1
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  channelDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  channelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  scopeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  scopeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600'
  },
  joinButton: {
    padding: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  }
});
