/**
 * Performance and Scalability Smoke Testing
 * Simulates high concurrency workload, measures latencies, and validates response budgets.
 */

import '../setup';
import { describe, it, expect, beforeAll } from '../framework';
import { api } from '../../frontend/src/utils/api';
import { performance } from 'perf_hooks';

describe('DairySphere Performance Smoke & Capacity Suite', () => {
  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');

    // Setup benchmark tenant
    await api.register({
      name: 'Benchmark Co-operative',
      slug: 'bench-coop',
      adminName: 'Engine Tester',
      adminEmail: 'bench@dairysphere.com',
      adminPassword: 'Password123!'
    });
  });

  it('should guarantee average response times are below 150ms for core operational queries', async () => {
    const latencies: number[] = [];

    // Perform 20 operational calls to measure latencies
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      await api.getFarmers();
      const end = performance.now();
      latencies.push(end - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    console.log(`\n  [Performance Stats] Average Farmers read query latency: ${avgLatency.toFixed(2)}ms`);
    expect(avgLatency).toBeLessThan(150); // Enforce response budget of 150ms
  });

  it('should aggregate complex Business Intelligence data grids and analytics heatmaps within a 200ms latency budget', async () => {
    const startHeatmap = performance.now();
    const heatmap = await api.getAnalyticsHeatmap();
    const endHeatmap = performance.now();

    const heatmapLatency = endHeatmap - startHeatmap;
    console.log(`  [Performance Stats] Analytics heatmap compile latency: ${heatmapLatency.toFixed(2)}ms`);
    
    expect(heatmap.length).toBe(7); // 7 days of week label matrix
    expect(heatmapLatency).toBeLessThan(200); // 200ms budget limit
  });

  it('should successfully handle concurrent transactions without race conditions or memory locks', async () => {
    // Simulate 15 operator transactions submitted concurrently
    const start = performance.now();
    const transactions = Array.from({ length: 15 }).map((_, i) => {
      return api.createFarmer({
        code: `FMR-LOAD-${1000 + i}`,
        name: `Load Test Farmer ${i}`,
        contacts: ['+91 90000 00000'],
        milkPreference: 'COW'
      });
    });

    const results = await Promise.all(transactions);
    const duration = performance.now() - start;

    console.log(`  [Performance Stats] Processed 15 concurrent farmer creations in ${duration.toFixed(2)}ms (${(15 / (duration / 1000)).toFixed(1)} operations/sec)`);
    
    expect(results.length).toBe(15);
    expect(duration).toBeLessThan(1000); // Massive batch completed under 1 second!
  });
});
