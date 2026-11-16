import createAxiosInstance from './axios';

/**
 * Reviews API service for moderation & staff management.
 */
class ReviewsApiService {
  constructor() {
    this.axios = createAxiosInstance();
  }

  async listForCompany(companyId, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) search.append(k, v);
    });
    const qs = search.toString();
    const url = companyId 
      ? `/v2/review/company/${companyId}/list${qs ? `?${qs}` : ''}`
      : `/v2/review/list${qs ? `?${qs}` : ''}`;
    const res = await this.axios.get(url);
    return Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
  }

  async listForEvent(eventId) {
    const res = await this.axios.get(`/v2/review/event/${eventId}/list`);
    return Array.isArray(res.data) ? res.data : (res.data?.results || []);
  }

  async eventSummary(eventId) {
    const res = await this.axios.get(`/v2/review/event/${eventId}/summary`);
    return res.data;
  }

  async approve(reviewId) {
    const res = await this.axios.post(`/v2/review/${reviewId}/approve`);
    return res.data;
  }

  async hide(reviewId) {
    const res = await this.axios.post(`/v2/review/${reviewId}/hide`);
    return res.data;
  }

  async reply(reviewId, reply) {
    const res = await this.axios.post(`/v2/review/${reviewId}/reply`, { reply });
    return res.data;
  }

  async remove(reviewId) {
    const res = await this.axios.delete(`/v2/review/${reviewId}`);
    return res.data;
  }

  async patch(reviewId, body) {
    const res = await this.axios.patch(`/v2/review/${reviewId}`, body);
    return res.data;
  }
}

const reviewsApiService = new ReviewsApiService();
export default reviewsApiService;
