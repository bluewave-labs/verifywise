/**
 * @fileoverview Sample AI Compliance Score Calculation
 *
 * Demonstrates the balanced weighted average calculation methodology
 * with realistic organizational data across the three modules.
 */

import { calculateComplianceScore } from '../utils/compliance.utils';

/**
 * Sample calculation demonstrating the balanced weighted average approach
 */
export const runSampleCalculation = async () => {
  console.log('🎯 AI Compliance Score - Sample Calculation');
  console.log('==========================================\n');

  // Sample organization data
  const organizationId = 1;
  const tenantId = 'sample-tenant';

  try {
    const complianceScore = await calculateComplianceScore(organizationId, tenantId);

    console.log('📊 OVERALL COMPLIANCE SCORE:', complianceScore.overallScore, '/100\n');

    console.log('📋 MODULE BREAKDOWN:');
    console.log('===================');

    // Risk Management Module
    const riskModule = complianceScore.modules.riskManagement;
    console.log(`\n🛡️  Risk Management: ${riskModule.score}/100 (Weight: ${riskModule.weight * 100}%)`);
    riskModule.components.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.score}/100 (Weight: ${comp.weight * 100}%)`);
      console.log(`     Data: ${JSON.stringify(comp.details)}`);
    });

    // Vendor Management Module
    const vendorModule = complianceScore.modules.vendorManagement;
    console.log(`\n🏢 Vendor Management: ${vendorModule.score}/100 (Weight: ${vendorModule.weight * 100}%)`);
    vendorModule.components.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.score}/100 (Weight: ${comp.weight * 100}%)`);
      console.log(`     Data: ${JSON.stringify(comp.details)}`);
    });

    // Project Governance Module
    const projectModule = complianceScore.modules.projectGovernance;
    console.log(`\n📋 Project Governance: ${projectModule.score}/100 (Weight: ${projectModule.weight * 100}%)`);
    projectModule.components.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.score}/100 (Weight: ${comp.weight * 100}%)`);
      console.log(`     Data: ${JSON.stringify(comp.details)}`);
    });

    console.log('\n🧮 CALCULATION DETAILS:');
    console.log('======================');
    console.log(`Risk Management Contribution: ${riskModule.score} × ${riskModule.weight} = ${(riskModule.score * riskModule.weight).toFixed(1)}`);
    console.log(`Vendor Management Contribution: ${vendorModule.score} × ${vendorModule.weight} = ${(vendorModule.score * vendorModule.weight).toFixed(1)}`);
    console.log(`Project Governance Contribution: ${projectModule.score} × ${projectModule.weight} = ${(projectModule.score * projectModule.weight).toFixed(1)}`);
    console.log(`Total: ${((riskModule.score * riskModule.weight) + (vendorModule.score * vendorModule.weight) + (projectModule.score * projectModule.weight)).toFixed(1)} → ${complianceScore.overallScore}`);

    console.log('\n📈 DATA QUALITY INDICATORS:');
    console.log('===========================');
    console.log(`Risk Management Quality: ${(riskModule.qualityScore * 100).toFixed(0)}% (${riskModule.totalDataPoints} data points)`);
    console.log(`Vendor Management Quality: ${(vendorModule.qualityScore * 100).toFixed(0)}% (${vendorModule.totalDataPoints} data points)`);
    console.log(`Project Governance Quality: ${(projectModule.qualityScore * 100).toFixed(0)}% (${projectModule.totalDataPoints} data points)`);

    console.log('\n📊 METADATA:');
    console.log('============');
    console.log(`Total Projects: ${complianceScore.metadata.totalProjects}`);
    console.log(`Applicable Projects: ${complianceScore.metadata.applicableProjects}`);
    console.log(`Calculation Method: ${complianceScore.metadata.calculationMethod}`);
    console.log(`Version: ${complianceScore.metadata.version}`);
    console.log(`Calculated At: ${complianceScore.calculatedAt.toISOString()}`);

    return complianceScore;

  } catch (error) {
    console.error('❌ Error calculating compliance score:', error);
    throw error;
  }
};

// Example showing balanced approach benefits
export const demonstrateBalancedApproach = () => {
  console.log('\n🎯 BALANCED APPROACH BENEFITS:');
  console.log('==============================');
  console.log('1. Compensation: Strong performance in one module can offset weaker performance in another');
  console.log('2. Realistic: Organizations can achieve good scores while improving specific areas');
  console.log('3. Progressive: Scores improve gradually as organizations enhance their practices');
  console.log('4. Fair: Doesn\'t penalize organizations for being strong in some areas but developing in others');

  console.log('\n📋 SAMPLE SCENARIOS:');
  console.log('===================');

  // Scenario 1: High performer
  console.log('\nScenario 1 - High Performer:');
  console.log('Risk: 90, Vendor: 85, Project: 88');
  console.log('Score: (90×0.35) + (85×0.35) + (88×0.30) = 87.6 → 88/100');

  // Scenario 2: Improving organization
  console.log('\nScenario 2 - Improving Organization:');
  console.log('Risk: 75, Vendor: 60, Project: 80');
  console.log('Score: (75×0.35) + (60×0.35) + (80×0.30) = 71.25 → 71/100');

  // Scenario 3: Focused strength
  console.log('\nScenario 3 - Strong in One Area:');
  console.log('Risk: 95, Vendor: 50, Project: 65');
  console.log('Score: (95×0.35) + (50×0.35) + (65×0.30) = 70.25 → 70/100');

  console.log('\n✅ The balanced approach allows organizations to achieve reasonable scores');
  console.log('   while working to improve weaker areas, encouraging continuous improvement.');
};

// Export functions for use
export { runSampleCalculation, demonstrateBalancedApproach };