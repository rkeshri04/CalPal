import React, { useState } from 'react';
import { View, SafeAreaView, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Collapsible } from '@/components/Collapsible';
import { WebView } from 'react-native-webview';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';


export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const logs = useSelector((state: RootState) => state.logs.entries);
  const userProfile = useSelector((state: RootState) => state.userProfile.profile);
  const [weightTab, setWeightTab] = useState<'1w' | '1m' | '1y' | 'all'>('1m');

  // Helper to filter bmiHistory by tab
  function getFilteredWeightHistory() {
    if (!userProfile) return [];
    const now = new Date();
    let cutoff = 0;
    if (weightTab === '1w') cutoff = 7;
    else if (weightTab === '1m') cutoff = 31;
    else if (weightTab === '1y') cutoff = 366;
    if (weightTab === 'all') return userProfile.bmiHistory;
    return userProfile.bmiHistory.filter(e => {
      const daysAgo = (now.getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= cutoff;
    });
  }
  const filteredWeight = getFilteredWeightHistory();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} >
      {/* <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Tips for You</Text> */}
      <View style={styles.tipsGrid}>
        {tips.map((tip, idx) => (
          <View key={tip.id} style={[styles.tipCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={{ color: Colors[colorScheme].text, textAlign: 'center', fontSize: 15 }}>{tip.text}</Text>
          </View>
        ))}
      </View>
      <Collapsible title="Weight Over Time">
        {userProfile && userProfile.bmiHistory.length > 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, gap: 8 }}>
              {['1w', '1m', '1y', 'all'].map(tab => (
                <Text
                  key={tab}
                  onPress={() => setWeightTab(tab as any)}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: weightTab === tab ? Colors[colorScheme].tint : Colors[colorScheme].card,
                    color: weightTab === tab ? Colors[colorScheme].background : Colors[colorScheme].text,
                    fontWeight: 'bold',
                    marginHorizontal: 2,
                    overflow: 'hidden',
                  }}
                >
                  {tab.toUpperCase()}
                </Text>
              ))}
            </View>
            {filteredWeight.length > 1 ? (
              <WeightSvgChart
                data={filteredWeight.map(e => userProfile.unitSystem === 'us' ? (e.weight / 0.453592) : e.weight)}
                labels={filteredWeight.map(e => e.date.slice(5, 10))}
                color={Colors[colorScheme].tint}
                background={Colors[colorScheme].card}
                textColor={Colors[colorScheme].text}
                onPointPress={idx => {
                  const entry = filteredWeight[idx];
                  alert(`Date: ${entry.date.slice(0,10)}\nWeight: ${entry.weight.toFixed(1)}${userProfile.unitSystem === 'us' ? ' lbs' : ' kg'}\nBMI: ${entry.bmi.toFixed(1)}`);
                }}
              />
            ) : (
              <Text style={{ color: Colors[colorScheme].icon, marginVertical: 12 }}>Not enough data for graph.</Text>
            )}
            <Text style={{ color: Colors[colorScheme].icon, marginTop: 8, fontSize: 13 }}>
              {userProfile.unitSystem === 'us' ? 'Weight (lbs)' : 'Weight (kg)'}
            </Text>
          </View>
        ) : (
          <Text style={{ color: Colors[colorScheme].icon, marginVertical: 12 }}>No weight data yet.</Text>
        )}
      </Collapsible>
      {/* <Collapsible title="Your Log Analysis">
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
      </Collapsible> */}
    </SafeAreaView>
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

// Move getMinMax to file scope so it's available everywhere
function getMinMax(arr: number[]) {
  if (!arr.length) return { min: 0, max: 1 };
  let min = arr[0], max = arr[0];
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) max = min + 1;
  return { min, max };
}

// Robinhood-style SVG chart with touchable points
function WeightSvgChart({ data, labels, color, background, textColor, onPointPress }: {
  data: number[];
  labels: string[];
  color: string;
  background: string;
  textColor: string;
  onPointPress: (idx: number) => void;
}) {
  if (data.length < 2) return null;
  const width = 320, height = 140, pad = 24;
  const { min, max } = getMinMax(data);
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = pad + (1 - (v - min) / (max - min)) * (height - 2 * pad);
    return { x, y };
  });
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <View style={{ width, height, backgroundColor: background, borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2={height}>
            <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        <Polyline
          points={polyline}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth={4}
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={7}
            fill="transparent"
            onPress={() => onPointPress(i)}
          />
        ))}
        {points.map((p, i) => (
          <Circle
            key={i + 'dot'}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={color}
            stroke={background}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={{ position: 'absolute', left: 0, bottom: 0, width, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: pad }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ color: textColor, fontSize: 10, opacity: 0.7 }}>{i === 0 || i === labels.length - 1 || labels.length <= 4 ? l : ''}</Text>
        ))}
      </View>
    </View>
  );
}
