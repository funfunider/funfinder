import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import SecurityIcon from '@mui/icons-material/Security';
import NoCrashIcon from '@mui/icons-material/NoCrash';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useLanguage } from '../../contexts/LanguageContext';

const Restrictions = () => {
  const { language } = useLanguage();
  const isKa = language === 'ka';

  const cardsData = [
    {
      title: isKa ? 'ჯანმრთელობისა და ფიზიკური შეზღუდვები' : 'Health & Physical Requirements',
      subtitle: isKa ? 'მნიშვნელოვანი სამედიცინო გაფრთხილებები' : 'Important medical notices',
      badge: isKa ? 'აუცილებელი' : 'Mandatory',
      badgeColor: '#dc2626',
      icon: <HealthAndSafetyIcon sx={{ fontSize: 28, color: '#dc2626' }} />,
      gradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.02) 100%)',
      borderColor: 'rgba(220, 38, 38, 0.2)',
      items: isKa ? [
        'ორსულობის პერიოდში ექსტრემალურ აქტივობებში (პარაგლაიდინგი, რაფტინგი, კვადროციკლები) მონაწილეობა მკაცრად აკრძალულია.',
        'გულ-სისხლძარღვთა მძიმე დაავადებების, ჰიპერტონიის ან ეპილეფსიის მქონე პირებისთვის აქტივობები არ არის რეკომენდებული.',
        'ხერხემლის, კისრის ან საყრდენ-მამოძრავებელი სისტემის მძიმე ტრავმების მქონე პირებმა წინასწარ უნდა გაიარონ კონსულტაცია ინსტრუქტორთან.',
        'ბოლოდროინდელი ქირურგიული ჩარევის ან მოტეხილობის შემთხვევაში აქტივობაზე დაშვება შეზღუდულია.',
      ] : [
        'Participation in extreme activities (paragliding, rafting, quad tours) is strictly prohibited during pregnancy.',
        'Activities are strongly discouraged for individuals with severe cardiovascular conditions, hypertension, or epilepsy.',
        'Guests with severe spine, neck, or musculoskeletal injuries must consult instructors prior to booking.',
        'Participants who underwent recent surgeries or bone fractures cannot be admitted.',
      ],
    },
    {
      title: isKa ? 'ასაკობრივი და წონითი შეზღუდვები' : 'Age & Weight Limits',
      subtitle: isKa ? 'აქტივობის სპეციფიკური ზღვრები' : 'Activity-specific boundaries',
      badge: isKa ? 'კრიტერიუმები' : 'Criteria',
      badgeColor: '#87003A',
      icon: <FitnessCenterIcon sx={{ fontSize: 28, color: '#87003A' }} />,
      gradient: 'linear-gradient(135deg, rgba(135, 0, 58, 0.08) 0%, rgba(135, 0, 58, 0.02) 100%)',
      borderColor: 'rgba(135, 0, 58, 0.2)',
      items: isKa ? [
        'ტანდემ პარაგლაიდინგი: მინიმალური ასაკი 6 წელი (მშობლის თანხმობით). წონითი ზღვარი: 30 კგ - 110 კგ.',
        'კვადროციკლების მართვა: მძღოლის მინიმალური ასაკი 16 წელი. მგზავრის მინიმალური ასაკი 7 წელი.',
        'ზღვის მოტოციკლი (Aqua Bike): მართვა დასაშვებია 18 წლიდან (ან ინსტრუქტორთან ერთად 14 წლიდან).',
        'სამთო რაფტინგი: მინიმალური ასაკი მარშრუტის სირთულის მიხედვით (სტანდარტულად 10-12 წელი).',
      ] : [
        'Tandem Paragliding: Minimum age 6 years (with parental consent). Passenger weight: 30 kg – 110 kg.',
        'Quad Safaris: Driver minimum age is 16 years. Passenger minimum age is 7 years.',
        'Jet Ski / Sea Moto: Solo driving from 18 years (or accompanied by instructor from 14 years).',
        'River Rafting: Minimum age depends on river grade (standard routes: 10–12 years).',
      ],
    },
    {
      title: isKa ? 'უსაფრთხოების წესები და აღჭურვილობა' : 'Safety Protocols & Equipment',
      subtitle: isKa ? 'სავალდებულო სტანდარტები' : 'Mandatory safety standards',
      badge: isKa ? 'უსაფრთხოება' : 'Safety',
      badgeColor: '#0284c7',
      icon: <SecurityIcon sx={{ fontSize: 28, color: '#0284c7' }} />,
      gradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(2, 132, 199, 0.02) 100%)',
      borderColor: 'rgba(2, 132, 199, 0.2)',
      items: isKa ? [
        'ნულოვანი ტოლერანტობა ალკოჰოლსა და ფსიქოაქტიურ ნივთიერებებზე — ნასვამი პირები ტურზე არ დაიშვებიან თანხის დაბრუნების გარეშე.',
        'ინსტრუქტორის მიერ გაცემული დამცავი აღჭურვილობის (ჩაფხუტი, სამაშველო ჟილეტი, სათვალე) ტარება სავალდებულოა მთელი აქტივობის მანძილზე.',
        'აქტივობის დაწყებამდე სავალდებულოა უსაფრთხოების ბრიფინგის გავლა და ინსტრუქტორის მითითებების მკაცრი დაცვა.',
        'ტექნიკისა და ეკიპირების განზრახ დაზიანების შემთხვევაში მატერიალური პასუხისმგებლობა ეკისრება მონაწილეს.',
      ] : [
        'Zero tolerance for alcohol and psychoactive substances — intoxicated participants are denied without refund.',
        'Wearing mandatory safety gear (helmets, life vests, goggles) provided by instructors is required at all times.',
        'A mandatory safety briefing must be attended before the activity, and guide directions must be followed strictly.',
        'Participants are financially liable for intentional damage caused to vehicles or gear.',
      ],
    },
    {
      title: isKa ? 'ამინდის პირობები და გადადება' : 'Weather Conditions & Rescheduling',
      subtitle: isKa ? 'გარემო ფაქტორები' : 'Environmental factors',
      badge: isKa ? 'ამინდი' : 'Weather',
      badgeColor: '#d97706',
      icon: <WbSunnyIcon sx={{ fontSize: 28, color: '#d97706' }} />,
      gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%)',
      borderColor: 'rgba(217, 119, 6, 0.2)',
      items: isKa ? [
        'პარაგლაიდინგი და საზღვაო ტურები პირდაპირ დამოკიდებულია მეტეოროლოგიურ პირობებზე (ქარის სიჩქარე, შტორმი, უამინდობა).',
        'თუ აქტივობა გაუქმდა უსაფრთხოების მიზნით უამინდობის გამო, ჯავშანი გადაიდება ალტერნატიულ დროს ან დაბრუნდება თანხა 100%-ით.',
        'სამთო და 4x4 ტურებზე რეკომენდებულია სეზონური სპორტული ტანსაცმელი და მოხერხებული დახურული ფეხსაცმელი.',
        'მონაწილეებს ეძლევათ რეკომენდაცია თან იქონიონ მზისგან დამცავი კრემი და წყალი.',
      ] : [
        'Paragliding and boat excursions depend heavily on meteorological safety (wind speed, storm, waves).',
        'If an event is cancelled due to weather safety, you can reschedule for free or receive a 100% full refund.',
        'For mountain safaris and land tours, comfortable closed shoes and season-appropriate clothing are required.',
        'Participants are advised to bring sun protection and personal hydration.',
      ],
    },
  ];

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: '#f8fafc', minHeight: '85vh' }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Chip
            label={isKa ? 'უსაფრთხოების სტანდარტები' : 'Safety Standards'}
            sx={{
              bgcolor: 'rgba(135, 0, 58, 0.1)',
              color: '#87003A',
              fontWeight: 700,
              mb: 1.5,
              fontSize: '0.8rem',
              letterSpacing: '0.04em',
            }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              fontSize: { xs: '1.85rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
              mb: 1.5,
            }}
          >
            {isKa ? 'აქტივობების შეზღუდვები და წესები' : 'Activity Restrictions & Guidelines'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.6,
            }}
          >
            {isKa
              ? 'თქვენი უსაფრთხოება და დაუვიწყარი გამოცდილება ჩვენი უმთავრესი პრიორიტეტია. გთხოვთ გაეცნოთ შეზღუდვებს დაჯავშნამდე.'
              : 'Your safety and unforgettable experience are our top priorities. Please review the restrictions below prior to booking.'}
          </Typography>
        </Box>

        {/* 2x2 Grid of High-End Modern Cards */}
        <Grid container spacing={3.5}>
          {cardsData.map((card, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: `1px solid ${card.borderColor}`,
                  background: '#ffffff',
                  boxShadow: '0 8px 26px -6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 36px -8px rgba(0, 0, 0, 0.1)',
                    borderColor: card.badgeColor,
                  },
                }}
              >
                {/* Header Strip */}
                <Box
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    background: card.gradient,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#ffffff',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#0f172a',
                          fontSize: { xs: '1.05rem', md: '1.2rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {card.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={card.badge}
                    size="small"
                    sx={{
                      bgcolor: alpha(card.badgeColor, 0.12),
                      color: card.badgeColor,
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      borderRadius: 2,
                    }}
                  />
                </Box>

                {/* Content List */}
                <CardContent sx={{ p: { xs: 2.5, md: 3 }, flexGrow: 1 }}>
                  <List disablePadding>
                    {card.items.map((item, itemIdx) => (
                      <ListItem
                        key={itemIdx}
                        disableGutters
                        alignItems="flex-start"
                        sx={{
                          py: 1.25,
                          borderBottom: itemIdx < card.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, mt: 0.4 }}>
                          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: card.badgeColor }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            sx: {
                              color: '#334155',
                              fontSize: { xs: '0.88rem', md: '0.92rem' },
                              lineHeight: 1.55,
                            },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Restrictions;