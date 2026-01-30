import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  TextInput,
} from 'react-native';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const categories = [
    { icon: '📚', name: 'Courses', count: 24 },
    { icon: '👥', name: 'Community', count: 156 },
    { icon: '📖', name: 'Library', count: 89 },
    { icon: '🎓', name: 'Events', count: 12 },
    { icon: '💼', name: 'Jobs', count: 8 },
    { icon: '🏆', name: 'Achievements', count: 34 },
  ];

  const trending = [
    {
      icon: '🔥',
      title: 'Introduction to AI',
      category: 'Computer Science',
      students: 1234,
    },
    {
      icon: '⚡',
      title: 'Web Development Bootcamp',
      category: 'Programming',
      students: 890,
    },
    {
      icon: '🌟',
      title: 'Data Science Fundamentals',
      category: 'Data Science',
      students: 756,
    },
    {
      icon: '💡',
      title: 'Mobile App Development',
      category: 'Development',
      students: 645,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}>
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0A1929' }]}
            placeholder="Search courses, people, resources..."
            placeholderTextColor={isDark ? '#90CAF9' : '#546E7A'}
          />
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
          Categories
        </Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryCard, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryName, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
                {category.name}
              </Text>
              <Text style={[styles.categoryCount, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
                {category.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
          Trending Now
        </Text>
        {trending.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.trendingCard, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}
          >
            <Text style={styles.trendingIcon}>{item.icon}</Text>
            <View style={styles.trendingContent}>
              <Text style={[styles.trendingTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
                {item.title}
              </Text>
              <Text style={[styles.trendingCategory, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
                {item.category}
              </Text>
              <Text style={[styles.trendingStudents, { color: isDark ? '#42A5F5' : '#1976D2' }]}>
                👥 {item.students.toLocaleString()} students
              </Text>
            </View>
            <Text style={[styles.trendingArrow, { color: isDark ? '#42A5F5' : '#1976D2' }]}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Recommendations */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
          Recommended for You
        </Text>
        <View style={[styles.recommendationCard, { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' }]}>
          <Text style={styles.recommendationIcon}>✨</Text>
          <Text style={[styles.recommendationTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.recommendationText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
            Get personalized course recommendations by completing your profile information.
          </Text>
          <TouchableOpacity
            style={[styles.recommendationButton, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]}
          >
            <Text style={styles.recommendationButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  trendingContent: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendingCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  trendingStudents: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingArrow: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  recommendationCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  recommendationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  recommendationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
