import React from 'react';
import { View, SafeAreaView, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Collapsible } from '@/components/Collapsible';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const logs = useSelector((state: RootState) => state.logs.entries);

  // Example tips (replace with your own or fetch from local/tips file)
  const tips = [
    { id: 1, text: 'Log your meals consistently for best results.' },
    { id: 2, text: 'Aim for a balanced intake of protein, carbs, and fat.' },
    { id: 3, text: 'Review your weekly calorie trends to spot patterns.' },
    { id: 4, text: 'Weigh your food for more accurate tracking.' },
    { id: 5, text: 'Drink plenty of water throughout the day.' },
    { id: 6, text: 'Try to log food right after eating to avoid forgetting.' },
  ];

  // Analysis data for collapsible
  const totalLogs = logs.length;
  const totalSpent = logs.reduce((sum, l) => sum + l.cost, 0);
  const totalWeight = logs.reduce((sum, l) => sum + l.weight, 0);
  const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fat || 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs || 0), 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein || 0), 0);
  const avgCalories = totalLogs ? totalCalories / totalLogs : 0;
  const avgCost = totalLogs ? totalSpent / totalLogs : 0;
  const avgWeight = totalLogs ? totalWeight / totalLogs : 0;
  const foodCount: Record<string, number> = {};
  logs.forEach(l => { foodCount[l.name] = (foodCount[l.name] || 0) + 1; });
  const mostFrequentFood = Object.entries(foodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const mostRecent = logs.length ? logs[0] : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Tips for You</Text>
      <View style={styles.tipsGrid}>
        {tips.map((tip, idx) => (
          <View key={tip.id} style={[styles.tipCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={{ color: Colors[colorScheme].text, textAlign: 'center', fontSize: 15 }}>{tip.text}</Text>
          </View>
        ))}
      </View>
      <Collapsible title="Your Log Analysis">
        <View style={styles.analysisGrid}>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Foods Logged</Text>
            <Text style={styles.analysisValue}>{totalLogs}</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Spent</Text>
            <Text style={styles.analysisValue}>${totalSpent.toFixed(2)}</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Weight</Text>
            <Text style={styles.analysisValue}>{totalWeight.toFixed(1)}g</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Calories</Text>
            <Text style={styles.analysisValue}>{totalCalories.toFixed(0)}</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Fat</Text>
            <Text style={styles.analysisValue}>{totalFat.toFixed(1)}g</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Carbs</Text>
            <Text style={styles.analysisValue}>{totalCarbs.toFixed(1)}g</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Total Protein</Text>
            <Text style={styles.analysisValue}>{totalProtein.toFixed(1)}g</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Avg Calories/Food</Text>
            <Text style={styles.analysisValue}>{avgCalories.toFixed(1)}</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Avg Cost/Food</Text>
            <Text style={styles.analysisValue}>${avgCost.toFixed(2)}</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Avg Weight/Food</Text>
            <Text style={styles.analysisValue}>{avgWeight.toFixed(1)}g</Text>
          </View>
          <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Most Frequent Food</Text>
            <Text style={styles.analysisValue}>{mostFrequentFood}</Text>
          </View>
          {mostRecent && (
            <View style={[styles.analysisCard, { backgroundColor: Colors[colorScheme].card }]}> 
              <Text style={[styles.analysisItem,  { color: Colors[colorScheme].text}]}>Most Recent Log</Text>
              <Text style={styles.analysisValue}>{mostRecent.name} ({new Date(mostRecent.date).toLocaleString()})</Text>
            </View>
          )}
        </View>
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  tipCard: {
    width: 150,
    height: 90,
    borderRadius: 14,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  analysisCard: {
    width: 150,
    height: 110,
    borderRadius: 16,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    padding: 10,
  },
  analysisItem: {
    fontSize: 15,
    marginBottom: 6,
  },
  analysisValue: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  safeAreaPad: {
    paddingTop: 24,
  },
  // Pills for tips (square)
  pillSquare: {
    width: 90,
    height: 90,
    borderRadius: 16,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: undefined, // set dynamically
    elevation: 2,
  },
});
