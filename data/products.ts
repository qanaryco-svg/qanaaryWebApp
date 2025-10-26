export type Product = {
  id: string
  title: string
  price: number
  images: string[]
  description: string
  category: string
  discount?: number // درصد تخفیف
  // optional style metadata used by the Style Finder (admin-editable tags)
  style?: {
    tags?: string[]
  }
}

export const products: Product[] = [
  {
    id: 'p1',
    title: 'پیراهن بهاری قناری',
    price: 129000,
    images: ['/p1.svg'],
    description: 'پیراهن سبک و رنگی مناسب فصل بهار.',
    category: 'پیراهن',
    discount: 15
  },
  {
    id: 'p2',
    title: 'شال ابریشمی',
    price: 89000,
    images: ['/p2.svg'],
    description: 'شال ابریشمی با الگوهای شکیل.',
    category: 'شال',
    discount: 0
  },
  {
    id: 'p3',
    title: 'کت تک مجلسی',
    price: 350000,
    images: ['/p3.svg'],
    description: 'کت تک با برش‌ فلسفه‌مند برای مهمانی‌ها.',
    category: 'کت و کاپشن',
    discount: 10
  },
  {
    id: 'p4',
    title: 'دامن کلوش',
    price: 99000,
    images: ['/p4.svg'],
    description: 'دامن کلوش مناسب استایل روزمره.',
    category: 'دامن'
  },
  {
    id: 'p5',
    title: 'شلوار جین برازنده',
    price: 149000,
    images: ['/p5.svg'],
    description: 'شلوار جین با برش راحت و شیک.',
    category: 'شلوار'
  },
  {
    id: 'p6',
    title: 'اکسسوری طلایی',
    price: 45000,
    images: ['/p6.svg'],
    description: 'گردنبند و گوشواره ست.',
    category: 'اکسسوری'
  }
  ,
  {
    id: 'p7',
    title: 'کفش اسپرت راحت',
    price: 220000,
    images: ['/p7.svg'],
    description: 'کفش اسپرت مناسب پیاده‌روی و باشگاه.',
    category: 'کفش'
  },
  {
    id: 'p8',
    title: 'هودی گرم و نرم',
    price: 179000,
    images: ['/p8.svg'],
    description: 'هودی با جنس ملایم و ضدپیلینگ.',
    category: 'هودی'
  },
  {
    id: 'p9',
    title: 'تی‌شرت نخی ساده',
    price: 69000,
    images: ['/p9.svg'],
    description: 'تی‌شرت نخی با برش استاندارد و رنگ‌های متنوع.',
    category: 'تی‌شرت'
  },
  {
    id: 'p10',
    title: 'تاپ کتان',
    price: 49000,
    images: ['/p10.svg'],
    description: 'تاپ راحتی برای استایل تابستانی.',
    category: 'تاپ'
  },
  {
    id: 'p11',
    title: 'ست ورزشی',
    price: 239000,
    images: ['/p11.svg'],
    description: 'ست ورزشی قابل تنفس و خشک‌شونده سریع.',
    category: 'لباس ورزشی'
  },
  {
    id: 'p12',
    title: 'ژاکت بافتنی',
    price: 199000,
    images: ['/p12.svg'],
    description: 'بافتنی دست‌دوخت با الیاف نرم.',
    category: 'بافت'
  },
  {
    id: 'p13',
    title: 'کفش پاشنه‌دار شیک',
    price: 320000,
    images: ['/p13.svg'],
    description: 'کفش پاشنه‌دار مناسب مجالس و مهمانی‌ها.',
    category: 'کفش'
  },
  {
    id: 'p14',
    title: 'ست زیرپوش راحت',
    price: 79000,
    images: ['/p14.svg'],
    description: 'زیرپوش نرم و ضدحساسیت برای استفاده روزمره.',
    category: 'لباس زیر'
  },
  {
    id: 'p15',
    title: 'جوراب‌های جور',
    price: 19000,
    images: ['/p15.svg'],
    description: 'جوراب‌های با کیفیت در بسته‌های چندتایی.',
    category: 'جوراب'
  }
]
