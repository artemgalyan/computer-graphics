function aggregateChannels(image, statistic) {
    let res = Array(image.channels)
    for (let c = 0; c < image.channels; ++c) {
        res[c] = image.getPixelXY(0, 0)[c]
    }
    for (let c = 0; c < image.channels; ++c) {
        for (let i = 0; i < image.width; ++i) {
            for (let j = 0; j < image.height; ++j) {
                res[c] = statistic(res[c], image.getPixelXY(i, j)[c])
            }
        }
    }
    return res
}

function linearContrasting(image) {
    let mins = aggregateChannels(image, Math.min)
    let maxs = aggregateChannels(image, Math.max)
    let result = IJS.Image.createFrom(image)

    for (let i = 0; i < image.width; ++i) {
        for (let j = 0; j < image.height; ++j) {
            let pixels = Array(image.channels)
            for (let c = 0; c < image.channels; ++c) {
                let diff = maxs[c] - mins[c]
                if (diff !== 0) {
                    pixels[c] = Math.floor(255 * (image.getPixelXY(i, j)[c] - mins[c]) / diff)
                } else {
                    pixels[c] = result.getPixelXY(i, j)[c]
                }
            }
            result.setPixelXY(i, j, pixels)
        }
    }
    return result
}

function equalizeChannel(image, channel, source, maxValue = 255) {
    let h = new Array(maxValue + 1).fill(0)
    for (let i = 0; i < source.width; ++i) {
        for (let j = 0; j < source.height; ++j) {
            h[source.getPixelXY(i, j)[channel]] += 1
        }
    }
    const hBig = source.width * source.height
    let sh = new Array(maxValue + 1).fill(0)
    sh[0] = h[0]
    for (let i = 1; i <= maxValue; ++i) {
        sh[i] = sh[i - 1] + h[i];
    }
    for (let i = 0; i < source.width; ++i) {
        for (let j = 0; j < source.height; ++j) {
            let pixelInSource = source.getPixelXY(i, j)[channel]
            let pixel = image.getPixelXY(i, j)
            pixel[channel] = Math.floor(maxValue * sh[pixelInSource] / hBig)
            image.setPixelXY(i, j, pixel)
        }
    }
}

function histogramEqualizationRGB(image) {
    let result = IJS.Image.createFrom(image)
    for (let c = 0; c < image.channels; ++c) {
        equalizeChannel(result, c, image)
    }
    return result
}

function hsvToRgb(h, s, v) {
    s /= 100
    v /= 100
    let c = v * s
    let x = c * (1 - Math.abs((h / 60) % 2 - 1))
    let m = v - c
    let r_, g_, b_
    if (h < 60) {
        r_ = c
        g_ = x
        b_ = 0
    } else if (h < 120) {
        r_ = x
        g_ = c
        b_ = 0
    } else if (h < 180) {
        r_ = 0
        g_ = c
        b_ = x
    } else if (h < 240) {
        r_ = 0
        g_ = x
        b_ = c
    } else if (h < 300) {
        r_ = x
        g_ = 0
        b_ = c
    } else {
        r_ = c
        g_ = 0
        b_ = x
    }
    let r, g, b
    r = 255 * (r_ + m)
    g = 255 * (g_ + m)
    b = 255 * (b_ + m)
    while (r < 0) {
        r += 255
    }
    while (r > 255) {
        r -= 255
    }
    while (g < 0) {
        g += 255
    }
    while (g > 255) {
        g -= 255
    }
    while (b < 0) {
        b += 255
    }
    while (b > 255) {
        b -= 255
    }
    return [r, g, b]
}

function rgbToHsv(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    let cmax = Math.max(r, g, b, 0.001)
    let cmin = Math.max(Math.min(r, g, b), 0.001)
    let delta = Math.max((cmax - cmin), 0.001)
    let h, s, v
    if (delta === 0) {
        h = 0
    } else if (cmax === r) {
        h = 60 * (((g - b) / delta) % 6)
    } else if (cmax === g) {
        h = 60 * ((b - r) / delta + 2)
    } else {
        h = 60 * ((r - g) / delta + 4)
    }
    if (h < 0) {
        h += 360
    }
    if (cmax === 0) {
        s = 0
    } else {
        s = delta / cmax
    }
    v = cmax
    return [h, s * 100, v * 100]
}

function histogramEqualizationHSV(image) {
    const hsvImage = image.hsv()
    let clone = IJS.Image.createFrom(hsvImage)
    for (let i = 0; i < image.width; ++i) {
        for (let j = 0; j < image.height; ++j) {
            clone.setPixelXY(i, j, rgbToHsv(...image.getPixelXY(i, j)))
        }
    }
    let result = IJS.Image.createFrom(image)

    console.log(image.getPixelXY(1, 2))
    console.log(rgbToHsv(...image.getPixelXY(1, 2)))
    console.log(hsvImage.getPixelXY(1, 2))
    console.log(clone.getPixelXY(1, 2))
    console.log(hsvToRgb(...clone.getPixelXY(1, 2)))
    equalizeChannel(clone, 2, clone, 100)
    for (let i = 0; i < image.width; ++i) {
        for (let j = 0; j < image.height; ++j) {
            result.setPixelXY(i, j, hsvToRgb(...clone.getPixelXY(i, j)))
        }
    }
    return result
}

function median(array) {
    array.sort((a, b) => a - b)
    return array[Math.floor(array.length / 2)]
}

function max(array) {
    let res = undefined
    for (let i of array) {
        if (res === undefined) {
            res = i
        } else {
            res = Math.max(res, i)
        }
    }
    return res
}

function min(array) {
    let res = undefined
    for (let i of array) {
        if (res === undefined) {
            res = i
        } else {
            res = Math.min(res, i)
        }
    }
    return res
}

function getStatisticalPixel(image, statistics, y, x, kernel = 3) {
    let depth = image.channels
    let result = Array(depth)

    let p = Math.floor(kernel / 2)
    for (let c = 0; c < depth; ++c) {
        let pixels = []
        for (let i = -p; i <= p; ++i) {
            if (x + i < 0 || x + i >= image.width) {
                break
            }
            for (let j = -p; j <= p; ++j) {
                if (y + j < 0 || y + j >= image.height) {
                    continue
                }
                pixels.push(image.getPixelXY(x + i, y + j)[c])
            }
        }
        result[c] = statistics(pixels)
    }
    return result
}

function statisticalFilter(image, statistics) {
    const w = image.width
    const h = image.height
    let result = IJS.Image.createFrom(image)
    for (let i = 0; i < h; ++i) {
        for (let j = 0; j < w; ++j) {
            result.setPixelXY(j, i, getStatisticalPixel(image, statistics, i, j))
        }
    }
    return result
}

const filters = {
    'max': max,
    'min': min,
    'median': median
}

function setImage(image) {
    document.getElementById('source').src = image.toDataURL()
    for (let f in filters) {
        document.getElementById(f + '-filter').src = statisticalFilter(image, filters[f]).toDataURL()
    }
    document.getElementById('linear-contrasting').src = linearContrasting(image).toDataURL()
    document.getElementById('hist-eq').src = histogramEqualizationRGB(image).toDataURL()
    document.getElementById('hist-eq-hsv').src = histogramEqualizationHSV(image).toDataURL()

}

async function loadImage(path) {
    const fr = new FileReader()
    await fr.readAsArrayBuffer(path)
    fr.onload = (_) => {
        IJS.Image.load(fr.result).then(setImage)
    }
}

document
    .getElementById('select-image')
    .addEventListener('input', async e => await loadImage(e.target.files[0]))
