
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">📊 Test Execution Report</h1>
        <p class="text-gray-600 mt-2">Automated & Manual Test Results</p>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">Last Updated</div>
        <div class="font-mono text-lg">{{ lastUpdated }}</div>
      </div>
    </div>

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <div class="text-gray-500 text-sm font-semibold uppercase">Total Cases</div>
        <div class="text-4xl font-bold text-gray-800 mt-2">{{ summary.total }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <div class="text-gray-500 text-sm font-semibold uppercase">Passed</div>
        <div class="text-4xl font-bold text-green-600 mt-2">{{ summary.pass }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
        <div class="text-gray-500 text-sm font-semibold uppercase">Failed</div>
        <div class="text-4xl font-bold text-red-600 mt-2">{{ summary.fail }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-400">
        <div class="text-gray-500 text-sm font-semibold uppercase">Not Run</div>
        <div class="text-4xl font-bold text-gray-600 mt-2">{{ summary.not_run }}</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Pie Chart -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-700">Test Status Distribution</h2>
        <div class="h-64 flex justify-center">
            <ClientOnly>
                <Pie v-if="chartData" :data="chartData" :options="chartOptions" />
            </ClientOnly>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-700">Health Check</h2>
        <div class="flex flex-col justify-center h-full space-y-6">
           <div>
             <div class="flex justify-between mb-1">
               <span class="text-base font-medium text-green-700">Pass Rate</span>
               <span class="text-sm font-medium text-green-700">{{ passRate }}%</span>
             </div>
             <div class="w-full bg-gray-200 rounded-full h-4">
               <div class="bg-green-600 h-4 rounded-full" :style="{ width: passRate + '%' }"></div>
             </div>
           </div>
           
           <div class="bg-blue-50 p-4 rounded-lg">
             <h3 class="font-bold text-blue-800 mb-2">Summary</h3>
             <ul class="list-disc list-inside text-blue-700 space-y-1">
               <li>Test Suite coverage: {{ coverageRate }}% executed</li>
               <li>Critical User Stories: US1, US3, US16</li>
             </ul>
           </div>
        </div>
      </div>
    </div>

    <!-- Filter & Table -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 class="text-xl font-semibold text-gray-700">Test Case Details</h2>
            <div class="flex space-x-2">
                <select v-model="filterStatus" class="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Status</option>
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                    <option value="NOT RUN">Not Run</option>
                </select>
            </div>
        </div>
        
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th class="py-3 px-6 text-left">ID</th>
              <th class="py-3 px-6 text-left">Module (Sheet)</th>
              <th class="py-3 px-6 text-left">Title</th>
              <th class="py-3 px-6 text-center">Status</th>
              <th class="py-3 px-6 text-left">Expected Result</th>
            </tr>
          </thead>
          <tbody class="text-gray-600 text-sm font-light">
            <tr v-for="tc in filteredDetails" :key="tc.id" class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-6 text-left whitespace-nowrap font-medium font-mono text-blue-600">
                {{ tc.id }}
              </td>
              <td class="py-3 px-6 text-left">
                <span class="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-xs">{{ tc.sheet.split(' - ')[0] }}</span>
              </td>
              <td class="py-3 px-6 text-left">
                <div class="font-medium text-gray-800">{{ tc.title }}</div>
                <div class="text-xs text-gray-500 mt-1 truncate max-w-xs">{{ tc.steps }}</div>
              </td>
              <td class="py-3 px-6 text-center">
                <span :class="getStatusClass(tc.status)" class="py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                  {{ tc.status }}
                </span>
              </td>
              <td class="py-3 px-6 text-left text-xs max-w-md">
                <div class="whitespace-pre-wrap">{{ tc.expected_result }}</div>
              </td>
            </tr>
            <tr v-if="filteredDetails.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-500">No test cases found matching filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const summary = ref({ total: 0, pass: 0, fail: 0, not_run: 0 })
const details = ref([])
const lastUpdated = ref(new Date().toLocaleString())
const filterStatus = ref('ALL')

const chartData = computed(() => {
    return {
        labels: ['Pass', 'Fail', 'Not Run'],
        datasets: [
            {
                backgroundColor: ['#10B981', '#EF4444', '#9CA3AF'],
                data: [summary.value.pass, summary.value.fail, summary.value.not_run]
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
}

const passRate = computed(() => {
    if (summary.value.total === 0) return 0
    return Math.round((summary.value.pass / summary.value.total) * 100)
})

const coverageRate = computed(() => {
    if (summary.value.total === 0) return 0
    const executed = summary.value.pass + summary.value.fail
    return Math.round((executed / summary.value.total) * 100)
})

const filteredDetails = computed(() => {
    if (filterStatus.value === 'ALL') return details.value
    return details.value.filter(tc => tc.status === filterStatus.value)
})

const getStatusClass = (status) => {
  switch (status) {
    case 'PASS': return 'bg-green-100 text-green-700 border border-green-200'
    case 'FAIL': return 'bg-red-100 text-red-700 border border-red-200'
    default: return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

onMounted(async () => {
    try {
        const response = await fetch('/test_report.json')
        const data = await response.json()
        summary.value = data.summary
        details.value = data.details
    } catch (error) {
        console.error('Failed to load report:', error)
    }
})
</script>
