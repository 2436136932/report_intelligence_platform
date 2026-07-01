<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const emit = defineEmits(['change'])

const captchaText = ref('')
const captchaCanvas = ref(null)

const drawCaptcha = () => {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#e0f2fe'
  ctx.lineWidth = 1
  for (let i = 0; i < canvas.height; i += 6) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i + (Math.random() - 0.5) * 10)
    ctx.stroke()
  }

  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = getRandomColor(100, 180)
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.bezierCurveTo(
      Math.random() * canvas.width, Math.random() * canvas.height,
      Math.random() * canvas.width, Math.random() * canvas.height,
      Math.random() * canvas.width, Math.random() * canvas.height
    )
    ctx.stroke()
  }

  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = getRandomColor(120, 200)
    ctx.beginPath()
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      0.8 + Math.random() * 1.2,
      0,
      2 * Math.PI
    )
    ctx.fill()
  }

  ctx.font = 'italic bold 22px "Lucida Console", Monaco, monospace'
  ctx.textBaseline = 'middle'

  const text = captchaText.value
  const charWidth = canvas.width / (text.length + 0.8)

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    ctx.fillStyle = getRandomColor(10, 80)

    ctx.save()
    const x = (i + 0.5) * charWidth + (Math.random() - 0.5) * 4
    const y = canvas.height / 2 + (Math.random() - 0.5) * 6
    const angle = (Math.random() - 0.5) * 0.4

    ctx.translate(x, y)
    ctx.rotate(angle)

    const scaleX = 0.9 + Math.random() * 0.2
    const scaleY = 0.9 + Math.random() * 0.2
    ctx.scale(scaleX, scaleY)

    ctx.fillText(char, -8, 2)
    ctx.restore()
  }
}

const getRandomColor = (min, max) => {
  const r = Math.floor(Math.random() * (max - min) + min)
  const g = Math.floor(Math.random() * (max - min) + min)
  const b = Math.floor(Math.random() * (max - min) + min)
  return `rgb(${r},${g},${b})`
}

const refreshCaptcha = () => {
  const chars = '23456789abcdefghkmnpqrstuvwxyz'
  let newText = ''
  for (let i = 0; i < 5; i++) {
    newText += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = newText
  drawCaptcha()
  emit('change', newText)
}

onMounted(() => {
  nextTick(() => {
    drawCaptcha()
    emit('change', captchaText.value)
  })
})

defineExpose({
  refresh: refreshCaptcha
})
</script>

<template>
  <div class="captcha-wrapper" @click="refreshCaptcha" title="点击刷新验证码">
    <canvas ref="captchaCanvas" width="100" height="38" class="captcha-canvas"></canvas>

    <!-- 悬停刷新遮罩 -->
    <div class="captcha-mask">
      <RefreshCw class="refresh-icon" />
    </div>
  </div>
</template>

<style scoped>
.captcha-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 136, 255, 0.2);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  user-select: none;
}

.captcha-canvas {
  display: block;
  background-color: #ffffff;
  transition: opacity 0.2s ease;
}

.captcha-wrapper:hover .captcha-canvas {
  opacity: 0.9;
}

.captcha-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.captcha-wrapper:hover .captcha-mask {
  opacity: 1;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  color: #ffffff;
}

.captcha-wrapper:hover .refresh-icon {
  /* 使用全局 style.css 中注册的 spin-slow 动画 */
  animation: spin-slow 8s linear infinite;
}
</style>
