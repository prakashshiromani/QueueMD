exports.getISTRange = (range, startDate, endDate) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  
  const getStartOfISTDay = (date) => {
    const d = new Date(date.getTime() + istOffset);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - istOffset);
  };

  let start, end;

  switch (range) {
    case 'today':
      start = getStartOfISTDay(now);
      end = now;
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      start = getStartOfISTDay(yesterday);
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;
    case '7d':
    case 'week':
      start = new Date(getStartOfISTDay(now).getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case '30d':
    case 'month':
      start = new Date(getStartOfISTDay(now).getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case '6m':
      start = new Date(getStartOfISTDay(now));
      start.setMonth(start.getMonth() - 6);
      end = now;
      break;
    case '1y':
      start = new Date(getStartOfISTDay(now));
      start.setFullYear(start.getFullYear() - 1);
      end = now;
      break;
    case 'all':
      start = new Date(0);
      end = now;
      break;
    case 'custom':
      if (startDate && endDate) {
        start = getStartOfISTDay(new Date(startDate));
        end = new Date(new Date(endDate).getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);
      } else {
        start = getStartOfISTDay(now);
        end = now;
      }
      break;
    default:
      start = getStartOfISTDay(now);
      end = now;
  }

  return { start, end };
};
