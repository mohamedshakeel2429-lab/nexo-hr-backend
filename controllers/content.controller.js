const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const SiteContent = require('../models/SiteContent.model');

exports.getContent = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOne({ key: req.params.key }).select('-__v -updatedBy');
  if (!content) throw ApiError.notFound(`Content block "${req.params.key}" not found`);
  ApiResponse.ok(res, { content });
});

exports.getAllContent = asyncHandler(async (req, res) => {
  const contents = await SiteContent.find({}).select('-__v').sort({ key: 1 });
  ApiResponse.ok(res, { contents });
});

exports.upsertContent = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { data, label } = req.body;

  if (!data) throw ApiError.badRequest('Content data is required');

  const content = await SiteContent.findOneAndUpdate(
    { key },
    { $set: { data, label: label || key, updatedBy: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  ApiResponse.ok(res, { content }, 'Content updated successfully');
});

exports.deleteContent = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOneAndDelete({ key: req.params.key });
  if (!content) throw ApiError.notFound(`Content block "${req.params.key}" not found`);
  ApiResponse.noContent(res);
});
