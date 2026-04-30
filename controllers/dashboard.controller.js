const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Contact = require('../models/Contact.model');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalJobs,
    activeJobs,
    draftJobs,
    totalApplications,
    applicationsThisMonth,
    applicationsLastMonth,
    pendingApplications,
    totalContacts,
    contactsThisMonth,
    contactsLastMonth,
    newContacts,
    recentApplications,
    recentContacts,
    applicationsByStatus,
    applicationsByJob,
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: 'Active' }),
    Job.countDocuments({ status: 'Draft' }),
    Application.countDocuments(),
    Application.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Application.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Application.countDocuments({ status: 'Pending' }),
    Contact.countDocuments(),
    Contact.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Contact.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Contact.countDocuments({ status: 'New' }),
    Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('job', 'title')
      .select('name email status createdAt job'),
    Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name company email status createdAt services'),
    Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'jobData' } },
      { $unwind: '$jobData' },
      { $project: { title: '$jobData.title', count: 1 } },
    ]),
  ]);

  const appGrowth = applicationsLastMonth
    ? Math.round(((applicationsThisMonth - applicationsLastMonth) / applicationsLastMonth) * 100)
    : 0;

  const contactGrowth = contactsLastMonth
    ? Math.round(((contactsThisMonth - contactsLastMonth) / contactsLastMonth) * 100)
    : 0;

  ApiResponse.ok(res, {
    overview: {
      jobs: { total: totalJobs, active: activeJobs, draft: draftJobs },
      applications: {
        total: totalApplications,
        thisMonth: applicationsThisMonth,
        pending: pendingApplications,
        growth: appGrowth,
      },
      contacts: {
        total: totalContacts,
        thisMonth: contactsThisMonth,
        new: newContacts,
        growth: contactGrowth,
      },
    },
    charts: {
      applicationsByStatus,
      applicationsByJob,
    },
    recent: {
      applications: recentApplications,
      contacts: recentContacts,
    },
  });
});
