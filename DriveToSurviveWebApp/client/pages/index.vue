<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary via-slate-900 to-primary">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px); background-size: 32px 32px;"></div>
      </div>
      <div class="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-28">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium rounded-full bg-cta/10 text-sky-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {{ $t('home.hero_badge') }}
            </div>
            <h1 class="mb-6 text-4xl font-bold leading-tight text-white font-heading lg:text-5xl xl:text-6xl">
              {{ $t('home.hero_title') }}<br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">{{ $t('home.hero_subtitle') }}</span>
            </h1>
            <p class="max-w-lg mb-8 text-lg leading-relaxed text-slate-300">
              {{ $t('home.hero_description') }}
            </p>
            <div class="flex flex-wrap gap-4">
              <NuxtLink :to="localePath('/findTrip')" class="inline-flex items-center gap-2 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-cta hover:bg-cta-hover hover:shadow-xl">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {{ $t('home.find_trip') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/register')" class="inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border rounded-lg text-slate-200 border-slate-500 hover:bg-white/10">
                {{ $t('home.get_started') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/about')" class="inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 rounded-lg text-sky-300 hover:text-sky-200 hover:bg-white/5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('home.about_us') }}
              </NuxtLink>
            </div>
            <!-- Trust badges -->
            <div class="flex flex-wrap items-center gap-6 mt-10">
              <div class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('home.trust_ekyc') }}
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('home.trust_gps') }}
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ $t('home.trust_pdpa') }}
              </div>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="relative">
              <div class="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
              <div class="relative p-6 border rounded-2xl bg-white/5 backdrop-blur border-white/10">
                <div class="grid gap-4">
                  <div class="flex items-center gap-3 p-3 border rounded-xl bg-white/5 border-white/10">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500/20">
                      <svg class="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm text-slate-400">{{ $t('home.mock_start') }}</p>
                      <p class="font-medium text-white">{{ $t('home.mock_start_val') }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 border rounded-xl bg-white/5 border-white/10">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20">
                      <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm text-slate-400">{{ $t('home.mock_end') }}</p>
                      <p class="font-medium text-white">{{ $t('home.mock_end_val') }}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-3 border rounded-xl bg-white/5 border-white/10">
                    <div class="flex items-center gap-2">
                      <div class="flex -space-x-2">
                        <div class="flex items-center justify-center w-8 h-8 border-2 rounded-full bg-sky-500 border-white/20 text-white text-xs font-bold">A</div>
                        <div class="flex items-center justify-center w-8 h-8 border-2 rounded-full bg-cyan-500 border-white/20 text-white text-xs font-bold">B</div>
                        <div class="flex items-center justify-center w-8 h-8 border-2 rounded-full bg-teal-500 border-white/20 text-white text-xs font-bold">C</div>
                      </div>
                      <span class="text-sm text-slate-400">{{ $t('home.mock_passengers') }}</span>
                    </div>
                    <span class="font-bold text-sky-400">฿ 120</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t bg-primary border-slate-800">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="grid gap-8 md:grid-cols-3">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-cta/20">
                <svg class="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span class="text-lg font-bold text-white font-heading">Drive To Survive</span>
            </div>
            <p class="text-sm text-slate-400">{{ $t('home.footer_desc') }}</p>
          </div>
          <div>
            <h4 class="mb-4 font-semibold text-white font-heading">{{ $t('home.links_important') }}</h4>
            <div class="space-y-2">
              <NuxtLink :to="localePath('/findTrip')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.find_trip') }}</NuxtLink>
              <NuxtLink :to="localePath('/createTrip')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.links_create_trip') }}</NuxtLink>
              <NuxtLink :to="localePath('/register')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.links_register') }}</NuxtLink>
              <NuxtLink :to="localePath('/about')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.about_us') }}</NuxtLink>
            </div>
          </div>
          <div>
            <h4 class="mb-4 font-semibold text-white font-heading">{{ $t('home.policies') }}</h4>
            <div class="space-y-2">
              <NuxtLink :to="localePath('/terms-of-service')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.terms') }}</NuxtLink>
              <NuxtLink :to="localePath('/privacy')" class="block text-sm cursor-pointer text-slate-400 hover:text-white">{{ $t('home.privacy') }}</NuxtLink>
            </div>
          </div>
        </div>
        <div class="pt-8 mt-8 text-sm text-center border-t border-slate-800 text-slate-500">
          © {{ new Date().getFullYear() }} {{ $t('home.copyright') }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const localePath = useLocalePath()
</script>