import React, { useEffect, useState, memo, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Load menus
import mcdonaldsMenu from '@/assets/restaurants/mcdonalds.json';
import chickfilaMenu from '@/assets/restaurants/chickfila.json';

const RESTAURANTS = [
  {
    name: "McDonald's",
    logo: 'https://1000logos.net/wp-content/uploads/2017/03/McDonalds-logo.png',
    menu: mcdonaldsMenu,
    id: 'mcdonalds',
  },
  {
    name: "Chick-fil-A's",
    logo: 'https://1000logos.net/wp-content/uploads/2021/04/Chick-fil-A-logo.png',
    menu: chickfilaMenu,
    id: 'chickfila',
  },
];

function isFoodItem(item: any) {
  return item && typeof item === 'object' && 'calories' in item && 'protein (g)' in item;
}

function parseMenuWithSections(menu: any[]) {
  const sections: { title: string; data: any[] }[] = [];
  let currentSection: { title: string; data: any[] } | null = null;
  for (const item of menu) {
    if (item && Object.keys(item).length === 1 && item.name) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: item.name, data: [] };
    } else if (currentSection) {
      currentSection.data.push(item);
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

// Flatten sections for single FlatList
function flattenSections(sections: { title: string; data: any[] }[]) {
  const flattened: { type: 'section' | 'item'; title?: string; item?: any }[] = [];
  sections.forEach(section => {
    flattened.push({ type: 'section', title: section.title });
    section.data.forEach(item => flattened.push({ type: 'item', item }));
  });
  return flattened;
}

export default function RestaurantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themedInput = [styles.input, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text }];

  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [filters, setFilters] = useState({ minCalories: '', maxCalories: '', minProtein: '', maxProtein: '', name: '' });
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 30;

  const handleChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const menuSections = useMemo(() => {
    if (!selectedRestaurant) return [];
    const menu = RESTAURANTS.find(r => r.id === selectedRestaurant)?.menu || [];
    const sections = parseMenuWithSections(menu);

    const filteredSections = sections
      .map(section => ({
        ...section,
        data: section.data.filter(item => {
          if (!isFoodItem(item)) return false;
          if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
          if (filters.minCalories && parseInt(item.calories || '0') < parseInt(filters.minCalories || '0')) return false;
          if (filters.maxCalories && parseInt(item.calories || '0') > parseInt(filters.maxCalories || '0')) return false;
          if (filters.minProtein && parseInt(item["protein (g)"] || '0') < parseInt(filters.minProtein || '0')) return false;
          if (filters.maxProtein && parseInt(item["protein (g)"] || '0') > parseInt(filters.maxProtein || '0')) return false;
          return true;
        }),
      }))
      .filter(section => section.data.length > 0);

    return filteredSections;
  }, [selectedRestaurant, filters]);

  const flattenedMenu = useMemo(() => flattenSections(menuSections).slice(0, PAGE_SIZE * page), [menuSections, page]);

  const handleLoadMore = () => {
    const totalItems = flattenSections(menuSections).length;
    if (flattenedMenu.length < totalItems) {
      setLoading(true);
      setTimeout(() => {
        setPage(p => p + 1);
        setLoading(false);
      }, 200);
    }
  };

  const MenuItem = memo(({ item, restaurantId }: any) => (
    <View style={[styles.item, { backgroundColor: Colors[colorScheme].card }]}>
      <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
      <Text style={{ color: Colors[colorScheme].text, fontSize: 13 }}>
        Calories: {item.calories} | Protein: {item["protein (g)"]}g | Carbs: {item["carbohydrates (g)"]}g | Fat: {item["total fat (g)"]}g
      </Text>
      {restaurantId === 'mcdonalds' && (
        <Text style={{ color: Colors[colorScheme].text, fontSize: 12 }}>Serving: {item["serving size"]}</Text>
      )}
    </View>
  ));
  MenuItem.displayName = 'MenuItem';

  if (!selectedRestaurant) {
    const filteredRestaurants = RESTAURANTS.filter(r =>
      r.name.toLowerCase().includes(restaurantSearch.toLowerCase())
    );
    return (
      <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors[colorScheme].card, borderRadius: 10, paddingHorizontal: 8, marginBottom: 10 }}>
          <TextInput
            style={[styles.restaurantSearchInput, { color: Colors[colorScheme].text, backgroundColor: 'transparent', flex: 1 }]}
            placeholder="Search restaurants..."
            placeholderTextColor={Colors[colorScheme].text + '99'}
            value={restaurantSearch}
            onChangeText={setRestaurantSearch}
          />
          {!!restaurantSearch && (
            <Pressable onPress={() => setRestaurantSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={Colors[colorScheme].tint} />
            </Pressable>
          )}
        </View>

        {filteredRestaurants.map(r => (
          <Pressable
            key={r.id}
            style={[styles.restaurantCard, { backgroundColor: Colors[colorScheme].card }]}
            onPress={() => setSelectedRestaurant(r.id)}
          >
            <Image source={{ uri: r.logo }} style={styles.restaurantLogo} resizeMode="contain" />
            <Text style={[styles.restaurantName, { color: Colors[colorScheme].text }]}>{r.name}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, marginBottom: 60, backgroundColor: Colors[colorScheme].background }}>
      <Pressable onPress={() => setSelectedRestaurant(null)} style={{ margin: 16 }}>
        <Text style={{ color: Colors[colorScheme].tint, fontWeight: 'bold' }}>{'< Back to Restaurants'}</Text>
      </Pressable>

      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{RESTAURANTS.find(r => r.id === selectedRestaurant)?.name} Menu Finder</Text>

      <View style={styles.filters}>
        <TextInput
          style={[themedInput, styles.searchInput]}
          placeholder="Search by name"
          placeholderTextColor={Colors[colorScheme].text + '99'}
          value={filters.name}
          onChangeText={v => handleChange('name', v)}
        />
        <View style={styles.row}>
          <TextInput
            style={[themedInput, styles.smallInput]}
            placeholder="Min Cal"
            keyboardType="numeric"
            value={filters.minCalories}
            onChangeText={v => handleChange('minCalories', v)}
          />
          <TextInput
            style={[themedInput, styles.smallInput]}
            placeholder="Max Cal"
            keyboardType="numeric"
            value={filters.maxCalories}
            onChangeText={v => handleChange('maxCalories', v)}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[themedInput, styles.smallInput]}
            placeholder="Min Protein"
            keyboardType="numeric"
            value={filters.minProtein}
            onChangeText={v => handleChange('minProtein', v)}
          />
          <TextInput
            style={[themedInput, styles.smallInput]}
            placeholder="Max Protein"
            keyboardType="numeric"
            value={filters.maxProtein}
            onChangeText={v => handleChange('maxProtein', v)}
          />
        </View>
      </View>

      <FlatList
        data={flattenedMenu}
        keyExtractor={(item, index) =>
          item.type === 'section' ? 'section-' + item.title + index : 'item-' + item.item.name + index
        }
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>{item.title}</Text>
          ) : (
            <MenuItem item={item.item} restaurantId={selectedRestaurant} />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color={Colors[colorScheme].tint} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  filters: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  searchInput: { borderRadius: 8, padding: 12, height: 48, fontSize: 16, marginBottom: 8 },
  restaurantSearchInput: { borderRadius: 8, padding: 12, height: 44, fontSize: 15 },
  input: { borderRadius: 8, padding: 12, height: 44, fontSize: 16, flex: 1 },
  smallInput: { flex: 1, marginRight: 8 },
  item: { padding: 12, borderRadius: 10, marginBottom: 10, elevation: 2 },
  itemName: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  restaurantCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  restaurantLogo: { width: 100, height: 60, marginRight: 16, borderRadius: 8 },
  restaurantName: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 6 },
});
