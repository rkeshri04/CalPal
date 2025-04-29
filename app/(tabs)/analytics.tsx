import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '../../supabaseClient';

const chartConfig = (colorScheme: string) => {
  const theme = Colors[colorScheme as 'light' | 'dark'];
  return {
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    color: (opacity = 1) => theme.tint,
    labelColor: (opacity = 1) => theme.text,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.tint },
  };
};

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const logs = useSelector((state: RootState) => state.logs.entries);
  const [tips, setTips] = useState<{ id: number; category: string; message: string }[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);

  // Fetch tips from Supabase
  useEffect(() => {
    setLoadingTips(true);
    supabase.from('tips').select('*').then(({ data }) => {
      setTips(data || []);
      setLoadingTips(false);
    });
  }, []);

  // Prepare chart data
  const { costData, caloriesData, weightData, labels } = useMemo(() => {
    const grouped: Record<string, typeof logs> = {};
    logs.forEach(log => {
      const date = log.date.slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });
    const sortedDates = Object.keys(grouped).sort();
    const costData = sortedDates.map(date => grouped[date].reduce((sum, l) => sum + l.cost, 0));
    const caloriesData = sortedDates.map(date => grouped[date].reduce((sum, l) => sum + (l.calories || 0), 0));
    const weightData = sortedDates.map(date => grouped[date].reduce((sum, l) => sum + l.weight, 0));
    return {
      costData,
      caloriesData,
      weightData,
      labels: sortedDates.map(d => d.slice(5)),
    };
  }, [logs]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Analytics</Text>
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme].tint }]}>Cost Trend</Text>
      {labels.length > 0 ? (
        <LineChart
          data={{ labels, datasets: [{ data: costData }] }}
          width={Dimensions.get('window').width - 32}
          height={180}
          chartConfig={chartConfig(colorScheme)}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={{ color: Colors[colorScheme].text, marginBottom: 16 }}>No data yet.</Text>
      )}
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme].tint }]}>Calories Trend</Text>
      {labels.length > 0 ? (
        <LineChart
          data={{ labels, datasets: [{ data: caloriesData }] }}
          width={Dimensions.get('window').width - 32}
          height={180}
          chartConfig={chartConfig(colorScheme)}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={{ color: Colors[colorScheme].text, marginBottom: 16 }}>No data yet.</Text>
      )}
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme].tint }]}>Weight Trend</Text>
      {labels.length > 0 ? (
        <LineChart
          data={{ labels, datasets: [{ data: weightData }] }}
          width={Dimensions.get('window').width - 32}
          height={180}
          chartConfig={chartConfig(colorScheme)}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={{ color: Colors[colorScheme].text, marginBottom: 16 }}>No data yet.</Text>
      )}
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme].tint, marginTop: 24 }]}>Tips for You</Text>
      {loadingTips ? (
        <ActivityIndicator color={Colors[colorScheme].tint} style={{ marginVertical: 16 }} />
      ) : (
        tips.map(tip => (
          <View key={tip.id} style={[styles.tipCard, { backgroundColor: Colors[colorScheme].card }]}> 
            <Text style={{ color: Colors[colorScheme].text }}>{tip.message}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  chart: { borderRadius: 12, marginBottom: 8 },
  tipCard: { borderRadius: 10, padding: 14, marginVertical: 6, width: '100%' },
});
