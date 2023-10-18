class Color {
    toRgb() {
        return new RGB(0, 0, 0)
    }

    loadRgb(rgb) {
    }

    colorName

    constructor(colorName) {
        this.colorName = colorName;
    }
}

class RGB extends Color {
    constructor(r, g, b) {
        super('rgb')
        this.r = r;
        while (this.r < 0) {
            this.r += 255
        }
        this.g = g;
        while (this.g < 0) {
            this.g += 255
        }
        this.b = b;
        while (this.b < 0) {
            this.b += 255
        }
    }

    minmax_step = {
        'r': [0, 255, 1],
        'g': [0, 255, 1],
        'b': [0, 255, 1]
    }

    r
    g
    b

    loadRgb(rgb) {
        this.r = Math.round(rgb.r)
        this.g = Math.round(rgb.g)
        this.b = Math.round(rgb.b)
    }

    toRgb() {
        return this
    }
}

globalColor = new RGB(0, 0, 0)

class CMYK extends Color {
    constructor(c, m, y, k) {
        super('cmyk');
        this.c = c;
        this.m = m;
        this.y = y;
        this.k = k;
    }

    toRgb() {
        return new RGB(
            255 * (1 - this.c) * (1 - this.k),
            255 * (1 - this.m) * (1 - this.k),
            255 * (1 - this.y) * (1 - this.k)
        )
    }

    loadRgb(rgb) {
        let r = rgb.r / 255
        let g = rgb.g / 255
        let b = rgb.b / 255
        this.k = Math.min(0.99, 1 - Math.max(r, g, b))
        this.c = (1 - r - this.k) / (1 - this.k)
        this.m = (1 - g - this.k) / (1 - this.k)
        this.y = (1 - b - this.k) / (1 - this.k)
    }

    minmax_step = {
        'c': [0, 0.99, 0.01],
        'm': [0, 1, 0.01],
        'y': [0, 1, 0.01],
        'k': [0, 0.99, 0.01]
    }

    c
    m
    y
    k
}

class HLS extends Color {
    constructor(h, l, s) {
        super('hls');
        this.h = h;
        this.l = l;
        this.s = s;
    }

    toRgb() {
        const c = x => Math.round(x * 255)
        let q = this.l + this.s - (this.l * this.s)
        if (this.l < 0.5) {
            q = this.l * (1 + this.s)
        }
        const p = 2 * this.l - q
        const hk = this.h / 360.
        const tr = hk + 1 / 3
        const tg = hk
        const tb = hk - 1 / 3
        return new RGB(c(this.hueToRgb(p, q, tr)), c(this.hueToRgb(p, q, tg)), c(this.hueToRgb(p, q, tb)))
    }

    hueToRgb(p, q, t) {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1.0 / 6) return p + (q - p) * 6 * t
        if (t < 1.0 / 2) return q
        if (t < 2.0 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }

    minmax_step = {
        'h': [0, 359, 0.01],
        'l': [0, 0.99, 0.01],
        's': [0, 0.99, 0.01],
    }

    loadRgb(rgb) {
        let r = rgb.r / 255
        let g = rgb.g / 255
        let b = rgb.b / 255
        let cmax = Math.max(r, g, b)
        let cmin = Math.min(r, g, b)
        let d = cmax - cmin
        if (d === 0) {
            this.h = 0
        } else if (cmax === r) {
            this.h = 60 * ((g - b) / d)
        } else if (cmax === g) {
            this.h = 60 * ((b - r) / d + 2)
        } else {
            this.h = 60 * ((r - g) / d + 4)
        }
        if (this.h < 0) {
            this.h += 360
        }

        this.l = (cmax + cmin) / 2
        if (d === 0) {
            this.s = 0
        } else {
            this.s = d / (1 - Math.abs(2 * this.l - 1))
        }
    }

    h
    l
    s
}

function getFields(o) {
    let result = []
    for (let property in o) {
        if (property.length === 1) {
            result.push(property)
        }
    }
    return result
}

const rgb = globalColor
const hls = new HLS(0, 0, 0)
hls.loadRgb(rgb)
const cmyk = new CMYK(0, 0, 0, 0)
cmyk.loadRgb(rgb)

tiedFields = []

function minmaxfilter(minmax, input) {
    return e => {
        const v = parseFloat(e.target.value)
        if (v < minmax[0]) {
            input.value = minmax[0]
        } else if (v > minmax[1]) {
            input.value = minmax[1]
        }
        if (minmax[2] >= 1) {
            input.value = Math.round(e.target.value)
        }
        if (input.value === '') {
            input.value = minmax[0]
        }
        e.target.value = input.value
    }
}

function getInputs(color, fieldName) {
    let input = document.createElement('input')
    const minmax = color.minmax_step[fieldName]
    input.value = minmax[0]
    input.type = 'number'
    input.id = fieldName + color.colorName //typeof(color).getName()
    input.addEventListener('input', minmaxfilter(minmax, input))
    input.addEventListener('input', e => {
        color[fieldName] = parseFloat(e.target.value)
        globalColor.loadRgb(color.toRgb())
        updateAll(color)
    })
    let label = document.createElement('label')
    label.for = input.id
    label.textContent = fieldName + ': '
    let slider = document.createElement('input')
    slider.min = minmax[0]
    slider.max = minmax[1]
    slider.step = minmax[2]
    slider.type = 'range'
    slider.id = fieldName + color.colorName + 'range'
    slider.addEventListener('input', e => {
        color[fieldName] = parseFloat(e.target.value)
        globalColor.loadRgb(color.toRgb())
        updateAll(color)
    })
    slider.value = minmax[0]

    let div = document.createElement('div')
    div.append(label, input, slider)
    tiedFields.push({
        'object': color,
        'fieldName': fieldName,
        'input': input
    })
    tiedFields.push({
        'object': color,
        'fieldName': fieldName,
        'input': slider
    })
    div.classList.add('selector-row')
    return div
}

function displayInfo(color) {
    let fields = getFields(color)
    let element = document.createElement('div')
    for (let f of fields) {
        element.append(getInputs(color, f))
    }
    return element
}

document.getElementById('rgb').appendChild(displayInfo(globalColor))
document.getElementById('hls').appendChild(displayInfo(hls))
document.getElementById('cmyk').appendChild(displayInfo(cmyk))

function to16(i) {
    let r = Number(i).toString(16)
    if (r.length === 1) {
        r = '0' + r
    }
    return r
}

function updateAll(ignored) {
    if (ignored !== hls) {
        hls.loadRgb(globalColor)
    }
    if (ignored !== cmyk) {
        cmyk.loadRgb(globalColor)
    }
    for (let o of tiedFields) {
        if (o['input'].value !== ignored) {
            o['input'].value = parseFloat(o['object'][o['fieldName']])
        }
    }
    document.getElementById('colorSelector').value = '#' +
        to16(globalColor.r) +
        to16(globalColor.g) +
        to16(globalColor.b)
}

document.getElementById('colorSelector')
    .addEventListener('input', value => {
        let color = value.target.value
        globalColor.r = parseInt(color.substring(1, 3), 16)
        globalColor.g = parseInt(color.substring(3, 5), 16)
        globalColor.b = parseInt(color.substring(5, 7), 16)
        updateAll()
    })

const rand = _ => Math.round(Math.random() * 255)

globalColor.r = rand()
globalColor.g = rand()
globalColor.b = rand()

updateAll(globalColor)
