import React, { useEffect, useState, memo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Collapsible } from '@/components/Collapsible';

// Load McDonald's menu
import mcdonaldsMenu from '@/assets/restaurants/mcdonalds.json';

const RESTAURANTS = [
  {
    name: "McDonald's",
    logo: 'https://1000logos.net/wp-content/uploads/2017/03/McDonalds-logo.png',
    menu: mcdonaldsMenu,
    id: 'mcdonalds',
  },
];

function isFoodItem(item: any) {
  return item.calories && item["protein (g)"];
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

export default function RestaurantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themedInput = [styles.input, { backgroundColor: Colors[colorScheme].card, color: Colors[colorScheme].text }];
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minCalories: '',
    maxCalories: '',
    minProtein: '',
    maxProtein: '',
    name: '',
  });
  const [filteredMenu, setFilteredMenu] = useState<any[]>([]);
  const [menuSections, setMenuSections] = useState<{ title: string; data: any[] }[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (!selectedRestaurant) return;
    const menu = RESTAURANTS.find(r => r.id === selectedRestaurant)?.menu || [];
    const sections = parseMenuWithSections(menu);
    // Apply filters to each section
    const filteredSections = sections.map(section => ({
      ...section,
      data: section.data.filter(item => {
        if (!isFoodItem(item)) return false;
        if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (filters.minCalories && parseInt(item.calories || '0') < parseInt(filters.minCalories || '0')) return false;
        if (filters.maxCalories && parseInt(item.calories || '0') > parseInt(filters.maxCalories || '0')) return false;
        if (filters.minProtein && parseInt(item["protein (g)"] || '0') < parseInt(filters.minProtein || '0')) return false;
        if (filters.maxProtein && parseInt(item["protein (g)"] || '0') > parseInt(filters.maxProtein || '0')) return false;
        return true;
      })
    }));
    setMenuSections(filteredSections);
    // For infinite scroll, flatten and slice
    const allItems = filteredSections.flatMap(s => s.data);
    setFilteredMenu(allItems.slice(0, PAGE_SIZE * page));
  }, [filters, selectedRestaurant, page]);

  const handleChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleLoadMore = () => {
    if (filteredMenu.length < (RESTAURANTS.find(r => r.id === selectedRestaurant)?.menu.filter(isFoodItem).length || 0)) {
      setLoading(true);
      setTimeout(() => {
        setPage(p => p + 1);
        setLoading(false);
      }, 200);
    }
  };

  if (!selectedRestaurant) {
    const filteredRestaurants = RESTAURANTS.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()));
    return (
        <>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors[colorScheme].card, borderRadius: 10, paddingHorizontal: 8, marginTop: 10 }}>
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
        <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background, flex: 1 }]}> 
            <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Select a Restaurant</Text>
            <View style={{ marginBottom: 16 }}>
            
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
        </ScrollView>
      </>
    );
  }

  // Memoized menu item for performance
  const MenuItem = memo(({ item, colorScheme, Colors }: any) => (
    <View style={[styles.item, { backgroundColor: Colors[colorScheme].card }]}> 
      <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
      <Text style={{ color: Colors[colorScheme].text, fontSize: 13 }}>Calories: {item.calories} | Protein: {item["protein (g)"]}g | Carbs: {item["carbohydrates (g)"]}g | Fat: {item["total fat (g)"]}g</Text>
      <Text style={{ color: Colors[colorScheme].text, fontSize: 12 }}>Serving: {item["serving size"]}</Text>
    </View>
  ));
  MenuItem.displayName = 'MenuItem';

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={styles.container}>
        <Pressable onPress={() => setSelectedRestaurant(null)} style={{ marginBottom: 12 }}>
          <Text style={{ color: Colors[colorScheme].tint, fontWeight: 'bold' }}>{'< Back to Restaurants'}</Text>
        </Pressable>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{RESTAURANTS.find(r => r.id === selectedRestaurant)?.name} Menu Finder</Text>
        <View style={styles.filters}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors[colorScheme].card, borderRadius: 10, marginBottom: 8, paddingHorizontal: 8 }}>
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme].text, backgroundColor: 'transparent', flex: 1 }]}
              placeholder="Search by name"
              placeholderTextColor={Colors[colorScheme].text + '99'}
              value={filters.name}
              onChangeText={v => handleChange('name', v)}
            />
            {!!filters.name && (
              <Pressable onPress={() => handleChange('name', '')} hitSlop={10}>
                <Ionicons name="close-circle" size={22} color={Colors[colorScheme].tint} />
              </Pressable>
            )}
          </View>
          <View style={styles.row}>
            <TextInput
              style={[themedInput, styles.smallInput]}
              placeholder="Min Cal"
              placeholderTextColor={Colors[colorScheme].text + '99'}
              keyboardType="numeric"
              value={filters.minCalories}
              onChangeText={v => handleChange('minCalories', v)}
            />
            <TextInput
              style={[themedInput, styles.smallInput]}
              placeholder="Max Cal"
              placeholderTextColor={Colors[colorScheme].text + '99'}
              keyboardType="numeric"
              value={filters.maxCalories}
              onChangeText={v => handleChange('maxCalories', v)}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[themedInput, styles.smallInput]}
              placeholder="Min Protein"
              placeholderTextColor={Colors[colorScheme].text + '99'}
              keyboardType="numeric"
              value={filters.minProtein}
              onChangeText={v => handleChange('minProtein', v)}
            />
            <TextInput
              style={[themedInput, styles.smallInput]}
              placeholder="Max Protein"
              placeholderTextColor={Colors[colorScheme].text + '99'}
              keyboardType="numeric"
              value={filters.maxProtein}
              onChangeText={v => handleChange('maxProtein', v)}
            />
          </View>
        </View>
        {/* <Text style={[styles.resultCount, { color: Colors[colorScheme].text }]}>{filteredMenu.length} items found</Text> */}
        <FlatList
          data={menuSections}
          keyExtractor={(section, sectionIndex) => section.title + sectionIndex}
          renderItem={({ item: section, index: sectionIndex }) => (
            <Collapsible defaultOpen={true} title={section.title} key={section.title + sectionIndex}>
              <FlatList
                data={section.data.slice(0, PAGE_SIZE * page)}
                keyExtractor={(item, index) => item.name + item["serving size"] + index}
                renderItem={({ item }) => (
                  <MenuItem item={item} colorScheme={colorScheme} Colors={Colors} />
                )}
                scrollEnabled={false}
              />
            </Collapsible>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator color={Colors[colorScheme].tint} /> : null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  filters: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  searchInput: { borderRadius: 8, padding: 12, height: 48, fontSize: 16 },
  restaurantSearchInput: { borderRadius: 8, padding: 12, height: 44, fontSize: 15 },
  input: { borderRadius: 8, padding: 12, height: 44, fontSize: 16, marginBottom: 8, flex: 1 },
  smallInput: { flex: 1, marginRight: 8 },
  resultCount: { marginBottom: 8, fontWeight: '600' },
  item: { padding: 12, borderRadius: 10, marginBottom: 10, elevation: 2 },
  itemName: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  restaurantCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  restaurantLogo: { width: 60, height: 60, marginRight: 16, borderRadius: 8, backgroundColor: '#fff' },
  restaurantName: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 6 },
});
